"use server";

import "server-only";

import { revalidatePath } from "next/cache";
import { UTApi } from "uploadthing/server";

import { UserRole } from "@/generated/prisma/client";
import { CurrentUser } from "@/lib/currentUser";
import { resolveFileAssetStorageKey } from "@/lib/file-assets";
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

type StorageJsonFile = {
  key?: unknown;
  url?: unknown;
  appUrl?: unknown;
  ufsUrl?: unknown;
};

type StorageListFile = {
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

function extractStorageKeys(value: unknown): string[] {
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

    const file = entry as StorageJsonFile;

    for (const candidate of [file.appUrl, file.ufsUrl, file.url]) {
      const normalized = normalizeKey(candidate);
      if (!normalized) {
        continue;
      }

      const extractedKey = resolveFileAssetStorageKey({
        storageKey: normalizeKey(file.key),
        url: normalized,
      });
      if (extractedKey) {
        keys.add(extractedKey);
      }
    }

    const directKey = normalizeKey(file.key);
    if (directKey) {
      keys.add(directKey);
    }
  };

  visit(value);

  return [...keys];
}

async function collectReferencedStorageKeys(): Promise<Set<string>> {
  const referenced = new Set<string>();

  const [
    fileAssets,
    productImages,
    users,
    stores,
    heroBanners,
    verificationDocuments,
    categories,
    siteConfigurations,
  ] = await Promise.all([
    prisma.fileAsset.findMany({
      select: {
        storageKey: true,
        url: true,
      },
    }),
    prisma.productImage.findMany({
      select: {
        fileAsset: {
          select: {
            storageKey: true,
            url: true,
          },
        },
      },
    }),
    prisma.user.findMany({
      select: {
        image: true,
        profileAvatarFileAsset: {
          select: {
            storageKey: true,
            url: true,
          },
        },
      },
    }),
    prisma.store.findMany({
      select: {
        logoFileAsset: {
          select: {
            storageKey: true,
            url: true,
          },
        },
        bannerImageFileAsset: {
          select: {
            storageKey: true,
            url: true,
          },
        },
      },
    }),
    prisma.heroBanner.findMany({
      select: {
        backgroundImageFileAsset: {
          select: {
            storageKey: true,
            url: true,
          },
        },
        productImageFileAsset: {
          select: {
            storageKey: true,
            url: true,
          },
        },
        lottieUrl: true,
      },
    }),
    prisma.verificationDocument.findMany({
      select: {
        fileAsset: {
          select: {
            storageKey: true,
            url: true,
          },
        },
      },
    }),
    prisma.category.findMany({
      select: {
        iconImageFileAsset: {
          select: {
            storageKey: true,
            url: true,
          },
        },
        bannerImageFileAsset: {
          select: {
            storageKey: true,
            url: true,
          },
        },
      },
    }),
    prisma.siteConfiguration.findMany({
      select: {
        siteLogoFileAsset: {
          select: {
            storageKey: true,
            url: true,
          },
        },
      },
    }),
  ]);

  for (const fileAsset of fileAssets) {
    const key = normalizeKey(fileAsset.storageKey);
    if (key) {
      referenced.add(key);
    }

    for (const extractedKey of extractStorageKeys({ url: fileAsset.url })) {
      referenced.add(extractedKey);
    }
  }

  for (const productImage of productImages) {
    const key = normalizeKey(productImage.fileAsset.storageKey);
    if (key) {
      referenced.add(key);
    }

    for (const extractedKey of extractStorageKeys({
      url: productImage.fileAsset.url,
    })) {
      referenced.add(extractedKey);
    }
  }

  for (const user of users) {
    for (const key of extractStorageKeys({ url: user.image })) {
      referenced.add(key);
    }

    const avatarKey = normalizeKey(user.profileAvatarFileAsset?.storageKey);
    if (avatarKey) {
      referenced.add(avatarKey);
    }

    if (user.profileAvatarFileAsset?.url) {
      for (const key of extractStorageKeys({
        url: user.profileAvatarFileAsset.url,
      })) {
        referenced.add(key);
      }
    }
  }

  for (const store of stores) {
    for (const asset of [store.logoFileAsset, store.bannerImageFileAsset]) {
      const key = normalizeKey(asset?.storageKey);
      if (key) {
        referenced.add(key);
      }

      if (asset?.url) {
        for (const extractedKey of extractStorageKeys({ url: asset.url })) {
          referenced.add(extractedKey);
        }
      }
    }
  }

  for (const heroBanner of heroBanners) {
    for (const asset of [
      heroBanner.backgroundImageFileAsset,
      heroBanner.productImageFileAsset,
    ]) {
      const key = normalizeKey(asset?.storageKey);
      if (key) {
        referenced.add(key);
      }

      if (asset?.url) {
        for (const extractedKey of extractStorageKeys({ url: asset.url })) {
          referenced.add(extractedKey);
        }
      }
    }

    for (const key of extractStorageKeys({ url: heroBanner.lottieUrl })) {
      referenced.add(key);
    }
  }

  for (const verificationDocument of verificationDocuments) {
    const key = normalizeKey(verificationDocument.fileAsset.storageKey);
    if (key) {
      referenced.add(key);
    }

    for (const extractedKey of extractStorageKeys({
      url: verificationDocument.fileAsset.url,
    })) {
      referenced.add(extractedKey);
    }
  }

  for (const category of categories) {
    for (const asset of [
      category.iconImageFileAsset,
      category.bannerImageFileAsset,
    ]) {
      const key = normalizeKey(asset?.storageKey);
      if (key) {
        referenced.add(key);
      }

      if (asset?.url) {
        for (const extractedKey of extractStorageKeys({ url: asset.url })) {
          referenced.add(extractedKey);
        }
      }
    }
  }

  for (const siteConfiguration of siteConfigurations) {
    const key = normalizeKey(siteConfiguration.siteLogoFileAsset?.storageKey);
    if (key) {
      referenced.add(key);
    }

    if (siteConfiguration.siteLogoFileAsset?.url) {
      for (const extractedKey of extractStorageKeys({
        url: siteConfiguration.siteLogoFileAsset.url,
      })) {
        referenced.add(extractedKey);
      }
    }
  }

  return referenced;
}

async function listAllStorageFiles(pageSize: number) {
  const files: StorageListFile[] = [];
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

function isStorageImage(file: StorageListFile) {
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

export async function cleanupOrphanedStorageImagesAction(
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
      message: `Deleted ${deletedKeys.length} orphaned storage image(s).`,
    };
  }

  const [referencedKeys, storageFiles] = await Promise.all([
    collectReferencedStorageKeys(),
    listAllStorageFiles(pageSize),
  ]);

  const imageFiles = storageFiles.filter(isStorageImage);
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
      message: `Dry run complete. Found ${orphanedKeys.length} orphaned storage image(s).`,
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
    message: `Deleted ${deletedKeys.length} orphaned storage image(s).`,
  };
}
