import { Prisma } from "@/generated/prisma";
import type {
  FileAssetCategory,
  FileAssetKind,
  Prisma as PrismaNamespace,
} from "@/generated/prisma";
import type { JsonFile } from "@/lib/types";

type EnsureFileAssetInput = {
  uploadedById?: string | null;
  file?: JsonFile | null;
  url?: string | null;
  storageKey?: string | null;
  category: FileAssetCategory;
  kind?: FileAssetKind;
  isPublic?: boolean;
  mimeType?: string | null;
  fileSize?: number | null;
  originalFileName?: string | null;
  metadata?: PrismaNamespace.InputJsonValue;
};

function normalizeStorageKey(value: string | null | undefined) {
  const trimmed = value?.trim();
  return trimmed ? trimmed : null;
}

function extractStorageKeyFromUrl(rawUrl: string) {
  try {
    const url = new URL(rawUrl);
    const parts = url.pathname.split("/").filter(Boolean);
    const fileSegmentIndex = parts.findIndex((part) => part === "f");

    if (fileSegmentIndex === -1) {
      return null;
    }

    return normalizeStorageKey(parts[fileSegmentIndex + 1]);
  } catch {
    return null;
  }
}

function inferExtension(urlOrKey: string) {
  return urlOrKey.split(".").pop()?.trim().toLowerCase() || null;
}

export function resolveFileAssetStorageKey(input: {
  file?: JsonFile | null;
  url?: string | null;
  storageKey?: string | null;
}) {
  const directKey = normalizeStorageKey(input.file?.key ?? input.storageKey);
  if (directKey) {
    return directKey;
  }

  const url = input.file?.url ?? input.url;
  return url ? extractStorageKeyFromUrl(url) : null;
}

export function mapFileAssetToJsonFile(asset: {
  storageKey: string;
  url: string;
}): JsonFile {
  return {
    url: asset.url,
    key: asset.storageKey,
  };
}

export function mapOptionalFileAssetToJsonFile(
  asset:
    | {
        storageKey: string;
        url: string;
      }
    | null
    | undefined,
): JsonFile | null {
  return asset ? mapFileAssetToJsonFile(asset) : null;
}

export async function ensureFileAsset(
  tx: PrismaNamespace.TransactionClient,
  input: EnsureFileAssetInput,
) {
  const url = input.file?.url ?? input.url ?? null;
  const storageKey = resolveFileAssetStorageKey(input);

  if (!storageKey || !url) {
    throw new Error("A stable file asset storage key and URL are required.");
  }

  const now = new Date();
  const kind = input.kind ?? "IMAGE";
  const isPublic = input.isPublic ?? true;
  const originalFileName =
    input.originalFileName ??
    normalizeStorageKey(input.file?.key ?? input.storageKey) ??
    storageKey;

  return tx.fileAsset.upsert({
    where: { storageKey },
    create: {
      storageProvider: "UPLOADTHING",
      storageKey,
      url,
      originalFileName,
      extension: inferExtension(storageKey) ?? inferExtension(url),
      mimeType: input.mimeType ?? null,
      fileSize: input.fileSize ?? null,
      category: input.category,
      kind,
      status: "ACTIVE",
      isPublic,
      uploadedById: input.uploadedById ?? undefined,
      lastUsedAt: now,
      metadata: input.metadata,
    },
    update: {
      url,
      originalFileName,
      extension: inferExtension(storageKey) ?? inferExtension(url) ?? undefined,
      mimeType: input.mimeType ?? undefined,
      fileSize: input.fileSize ?? undefined,
      category: input.category,
      kind,
      status: "ACTIVE",
      isPublic,
      uploadedById: input.uploadedById ?? undefined,
      lastUsedAt: now,
      deletedAt: null,
      orphanedAt: null,
      metadata: input.metadata,
    },
    select: {
      id: true,
      storageKey: true,
      url: true,
      mimeType: true,
      fileSize: true,
      originalFileName: true,
    },
  });
}
