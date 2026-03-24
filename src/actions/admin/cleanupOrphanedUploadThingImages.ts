"use server";

import "server-only";

import { revalidatePath } from "next/cache";
import { UTApi } from "uploadthing/server";

import { UserRole } from "@/generated/prisma/client";
import { CurrentUser } from "@/lib/currentUser";
import { prisma } from "@/lib/prisma";

const utapi = new UTApi();

const IMAGE_EXTENSIONS = new Set([
  "jpg",
  "jpeg",
  "png",
  "webp",
  "gif",
  "heic",
  "heif",
  "avif",
  "svg",
]);

const DELETE_BATCH_SIZE = 50;
const DEFAULT_PAGE_SIZE = 200;
const MAX_PAGE_SIZE = 500;
const DEFAULT_MAX_DELETES = 500;

type CleanupInput = {
  dryRun?: boolean;
  pageSize?: number;
  maxDeletes?: number;
  keysToDelete?: string[];
};

type CleanupResult = {
  success: boolean;
  dryRun: boolean;
  scanned: number;
  referenced: number;
  orphaned: number;
  deleted: number;
  deletedKeys: string[];
  orphanedKeys: string[];
  message: string;
};

type UploadThingJsonFile = {
  key?: unknown;
  url?: unknown;
  appUrl?: unknown;
  ufsUrl?: unknown;
};

type UploadThingListFile = {
  id: string;
  key: string;
  name: string;
};

function assertAdmin(role?: UserRole | null) {
  if (role !== UserRole.ADMIN) {
    throw new Error("Unauthorized");
  }
}

function normalizeKey(value: unknown): string | null {
  if (typeof value !== "string") {
    return null;
  }

  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function extractUploadThingKeyFromUrl(rawUrl: string): string | null {
  try {
    const url = new URL(rawUrl);
    const parts = url.pathname.split("/").filter(Boolean);
    const fileSegmentIndex = parts.findIndex((part) => part === "f");

    if (fileSegmentIndex === -1) {
      return null;
    }

    return normalizeKey(parts[fileSegmentIndex + 1]);
  } catch {
    return null;
  }
}

function extractUploadThingKeys(value: unknown): string[] {
  const keys = new Set<string>();

  const visit = (entry: unknown) => {
    if (Array.isArray(entry)) {
      for (const item of entry) {
        visit(item);
      }
      return;
    }

    if (!entry || typeof entry !== "object") {
      return;
    }

    const file = entry as UploadThingJsonFile;

    const directKey = normalizeKey(file.key);
    if (directKey) {
      keys.add(directKey);
    }

    for (const candidate of [file.appUrl, file.ufsUrl, file.url]) {
      const normalized = normalizeKey(candidate);
      if (!normalized) {
        continue;
      }

      const extractedKey = extractUploadThingKeyFromUrl(normalized);
      if (extractedKey) {
        keys.add(extractedKey);
      }
    }
  };

  visit(value);

  return [...keys];
}

async function collectReferencedUploadThingKeys(): Promise<Set<string>> {
  const referenced = new Set<string>();

  const [
    productImages,
    users,
    stores,
    heroBanners,
    verificationDocuments,
    categories,
    disputeEvidences,
    siteConfigurations,
  ] = await Promise.all([
    prisma.productImage.findMany({
      select: {
        imageKey: true,
        imageUrl: true,
      },
    }),
    prisma.user.findMany({
      select: {
        image: true,
        profileAvatar: true,
      },
    }),
    prisma.store.findMany({
      select: {
        logo: true,
        logoKey: true,
        bannerImage: true,
        bannerKey: true,
      },
    }),
    prisma.heroBanner.findMany({
      select: {
        backgroundImage: true,
        productImage: true,
        lottieUrl: true,
      },
    }),
    prisma.verificationDocument.findMany({
      select: {
        file: true,
      },
    }),
    prisma.category.findMany({
      select: {
        iconImage: true,
        bannerImage: true,
      },
    }),
    prisma.disputeEvidence.findMany({
      select: {
        fileUrl: true,
      },
    }),
    prisma.siteConfiguration.findMany({
      select: {
        siteLogo: true,
      },
    }),
  ]);

  for (const productImage of productImages) {
    const key = normalizeKey(productImage.imageKey);
    if (key) {
      referenced.add(key);
    }

    for (const extractedKey of extractUploadThingKeys({
      url: productImage.imageUrl,
    })) {
      referenced.add(extractedKey);
    }
  }

  for (const user of users) {
    for (const key of extractUploadThingKeys({ url: user.image })) {
      referenced.add(key);
    }

    for (const key of extractUploadThingKeys(user.profileAvatar)) {
      referenced.add(key);
    }
  }

  for (const store of stores) {
    for (const key of [store.logoKey, store.bannerKey]) {
      const normalized = normalizeKey(key);
      if (normalized) {
        referenced.add(normalized);
      }
    }

    for (const key of extractUploadThingKeys({
      url: store.logo,
    })) {
      referenced.add(key);
    }

    for (const key of extractUploadThingKeys({
      url: store.bannerImage,
    })) {
      referenced.add(key);
    }
  }

  for (const heroBanner of heroBanners) {
    for (const key of extractUploadThingKeys(heroBanner.backgroundImage)) {
      referenced.add(key);
    }

    for (const key of extractUploadThingKeys(heroBanner.productImage)) {
      referenced.add(key);
    }

    for (const key of extractUploadThingKeys({ url: heroBanner.lottieUrl })) {
      referenced.add(key);
    }
  }

  for (const verificationDocument of verificationDocuments) {
    for (const key of extractUploadThingKeys(verificationDocument.file)) {
      referenced.add(key);
    }
  }

  for (const category of categories) {
    for (const key of extractUploadThingKeys({ url: category.iconImage })) {
      referenced.add(key);
    }

    for (const key of extractUploadThingKeys({ url: category.bannerImage })) {
      referenced.add(key);
    }
  }

  for (const disputeEvidence of disputeEvidences) {
    for (const key of extractUploadThingKeys({ url: disputeEvidence.fileUrl })) {
      referenced.add(key);
    }
  }

  for (const siteConfiguration of siteConfigurations) {
    for (const key of extractUploadThingKeys({
      url: siteConfiguration.siteLogo,
    })) {
      referenced.add(key);
    }
  }

  return referenced;
}

async function listAllUploadThingFiles(pageSize: number) {
  const files: UploadThingListFile[] = [];
  let offset = 0;

  while (true) {
    const response = await utapi.listFiles({
      limit: pageSize,
      offset,
    });

    for (const file of response.files) {
      if (
        typeof file.id === "string" &&
        typeof file.key === "string" &&
        typeof file.name === "string"
      ) {
        files.push({
          id: file.id,
          key: file.key,
          name: file.name,
        });
      }
    }

    if (!response.hasMore) {
      break;
    }

    offset += pageSize;
  }

  return files;
}

function isImageFile(file: UploadThingListFile) {
  const fileName = file.name || file.key;
  const extension = fileName.split(".").pop()?.toLowerCase();

  return extension ? IMAGE_EXTENSIONS.has(extension) : false;
}

function chunkArray<T>(items: T[], size: number): T[][] {
  const chunks: T[][] = [];

  for (let index = 0; index < items.length; index += size) {
    chunks.push(items.slice(index, index + size));
  }

  return chunks;
}

export async function cleanupOrphanedUploadThingImagesAction(
  input: CleanupInput = {},
): Promise<CleanupResult> {
  const user = await CurrentUser();
  assertAdmin(user?.role);

  const dryRun = input.dryRun ?? true;
  const pageSize = Math.min(
    Math.max(input.pageSize ?? DEFAULT_PAGE_SIZE, 1),
    MAX_PAGE_SIZE,
  );
  const maxDeletes = Math.max(input.maxDeletes ?? DEFAULT_MAX_DELETES, 1);
  const requestedKeysToDelete = Array.from(
    new Set(
      (input.keysToDelete ?? []).reduce<string[]>((keys, value) => {
        const normalized = normalizeKey(value);

        if (normalized) {
          keys.push(normalized);
        }

        return keys;
      }, []),
    ),
  );

  if (!dryRun && requestedKeysToDelete.length > 0) {
    const keysToDelete = requestedKeysToDelete.slice(0, maxDeletes);
    const deletedKeys: string[] = [];

    for (const chunk of chunkArray(keysToDelete, DELETE_BATCH_SIZE)) {
      await utapi.deleteFiles(chunk);
      deletedKeys.push(...chunk);
    }

    revalidatePath("/marketplace/dashboard");
    revalidatePath("/marketplace/dashboard/admin");
    revalidatePath("/marketplace/dashboard/admin/storage-cleanup");
    revalidatePath("/marketplace/dashboard/admin/marketing/banners");

    return {
      success: true,
      dryRun: false,
      scanned: 0,
      referenced: 0,
      orphaned: requestedKeysToDelete.length,
      deleted: deletedKeys.length,
      deletedKeys,
      orphanedKeys: requestedKeysToDelete,
      message: `Deleted ${deletedKeys.length} orphaned UploadThing image(s).`,
    };
  }

  const [referencedKeys, uploadThingFiles] = await Promise.all([
    collectReferencedUploadThingKeys(),
    listAllUploadThingFiles(pageSize),
  ]);

  const imageFiles = uploadThingFiles.filter(isImageFile);
  const orphanedKeys = imageFiles
    .map((file) => file.key)
    .filter((key) => !referencedKeys.has(key));

  if (dryRun) {
    return {
      success: true,
      dryRun: true,
      scanned: imageFiles.length,
      referenced: referencedKeys.size,
      orphaned: orphanedKeys.length,
      deleted: 0,
      deletedKeys: [],
      orphanedKeys,
      message: `Dry run complete. Found ${orphanedKeys.length} orphaned UploadThing image(s).`,
    };
  }

  const keysToDelete = orphanedKeys.slice(0, maxDeletes);
  const deletedKeys: string[] = [];

  for (const chunk of chunkArray(keysToDelete, DELETE_BATCH_SIZE)) {
    await utapi.deleteFiles(chunk);
    deletedKeys.push(...chunk);
  }

  revalidatePath("/marketplace/dashboard");
  revalidatePath("/marketplace/dashboard/admin");
  revalidatePath("/marketplace/dashboard/admin/storage-cleanup");
  revalidatePath("/marketplace/dashboard/admin/marketing/banners");

  return {
    success: true,
    dryRun: false,
    scanned: imageFiles.length,
    referenced: referencedKeys.size,
    orphaned: orphanedKeys.length,
    deleted: deletedKeys.length,
    deletedKeys,
    orphanedKeys,
    message: `Deleted ${deletedKeys.length} orphaned UploadThing image(s).`,
  };
}
