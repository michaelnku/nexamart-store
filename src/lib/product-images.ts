import { Prisma } from "@/generated/prisma";
import type { Prisma as PrismaNamespace } from "@/generated/prisma";
import { prisma } from "@/lib/prisma";
import { mapStoreMedia } from "@/lib/media-views";
import type { JsonFile } from "@/lib/types";

export const productImageWithAssetInclude =
  Prisma.validator<PrismaNamespace.ProductImageInclude>()({
    fileAsset: true,
  });

export type ProductImageWithAsset = PrismaNamespace.ProductImageGetPayload<{
  include: typeof productImageWithAssetInclude;
}>;

export type ProductImageView = {
  id: string;
  fileAssetId: string;
  imageUrl: string;
  imageKey: string;
  fileAsset: ProductImageWithAsset["fileAsset"];
};

export function mapProductImageToView(
  image: ProductImageWithAsset,
): ProductImageView {
  return {
    id: image.id,
    fileAssetId: image.fileAssetId,
    imageUrl: image.fileAsset.url,
    imageKey: image.fileAsset.storageKey,
    fileAsset: image.fileAsset,
  };
}

export function mapProductImagesToView(
  images: ProductImageWithAsset[],
): ProductImageView[] {
  return images.map(mapProductImageToView);
}

export function mapProductImagesToJsonFiles(
  images: ProductImageWithAsset[],
): JsonFile[] {
  return images.map((image) => ({
    url: image.fileAsset.url,
    key: image.fileAsset.storageKey,
  }));
}

export function mapRecordProductImages<T extends { images: ProductImageWithAsset[] }>(
  record: T,
): Omit<T, "images"> & { images: ProductImageView[] } {
  return {
    ...record,
    images: mapProductImagesToView(record.images),
  };
}

export function mapRecordProductImagesWithStoreMedia<
  T extends {
    images: ProductImageWithAsset[];
    store: {
      logoFileAsset?: { storageKey: string; url: string } | null;
      bannerImageFileAsset?: { storageKey: string; url: string } | null;
    };
  },
>(record: T): Omit<T, "images" | "store"> & {
  images: ProductImageView[];
  store: ReturnType<typeof mapStoreMedia<T["store"]>>;
} {
  return {
    ...record,
    images: mapProductImagesToView(record.images),
    store: mapStoreMedia(record.store),
  };
}

function normalizeStorageKey(value: string | null | undefined) {
  const trimmed = value?.trim();
  return trimmed ? trimmed : null;
}

function inferExtension(urlOrKey: string) {
  return urlOrKey.split(".").pop()?.trim().toLowerCase() || null;
}

type FileAssetWriteClient = Pick<PrismaNamespace.TransactionClient, "fileAsset">;

export async function ensureProductImageFileAsset(
  db: FileAssetWriteClient,
  input: {
    uploadedById: string | null;
    image: JsonFile;
  },
) {
  const storageKey = normalizeStorageKey(input.image.key);

  if (!storageKey) {
    throw new Error("Product image is missing a stable storage key.");
  }

  const now = new Date();

  return db.fileAsset.upsert({
    where: { storageKey },
    create: {
      storageProvider: "UPLOADTHING",
      storageKey,
      url: input.image.url,
      originalFileName: storageKey,
      extension: inferExtension(storageKey) ?? inferExtension(input.image.url),
      mimeType: null,
      fileSize: null,
      category: "PRODUCT_MEDIA",
      kind: "IMAGE",
      status: "ACTIVE",
      isPublic: true,
      uploadedById: input.uploadedById ?? undefined,
      lastUsedAt: now,
    },
    update: {
      url: input.image.url,
      originalFileName: storageKey,
      extension: inferExtension(storageKey) ?? inferExtension(input.image.url) ?? undefined,
      kind: "IMAGE",
      status: "ACTIVE",
      isPublic: true,
      uploadedById: input.uploadedById ?? undefined,
      lastUsedAt: now,
      deletedAt: null,
      orphanedAt: null,
    },
    select: {
      id: true,
      storageKey: true,
    },
  });
}

export async function ensureProductImageFileAssets(
  input: {
    uploadedById: string | null;
    images: JsonFile[];
  },
) {
  return Promise.all(
    input.images.map((image) =>
      ensureProductImageFileAsset(prisma, {
        uploadedById: input.uploadedById,
        image,
      }),
    ),
  );
}

export async function touchOrMarkFileAssetOrphaned(
  db: FileAssetWriteClient,
  fileAssetId: string,
) {
  const usage = await db.fileAsset.findUnique({
    where: { id: fileAssetId },
    select: {
      id: true,
      _count: {
        select: {
          productImages: true,
          deliveryEvidences: true,
          disputeEvidences: true,
          verificationDocuments: true,
          userProfileAvatarUsers: true,
          storeLogoStores: true,
          storeBannerStores: true,
          categoryIconCategories: true,
          categoryBannerCategories: true,
          heroBannerBackgrounds: true,
          heroBannerProducts: true,
          siteConfigurationLogos: true,
        },
      },
    },
  });

  if (!usage) {
    return;
  }

  const totalRefs =
    usage._count.productImages +
    usage._count.deliveryEvidences +
    usage._count.disputeEvidences +
    usage._count.verificationDocuments +
    usage._count.userProfileAvatarUsers +
    usage._count.storeLogoStores +
    usage._count.storeBannerStores +
    usage._count.categoryIconCategories +
    usage._count.categoryBannerCategories +
    usage._count.heroBannerBackgrounds +
    usage._count.heroBannerProducts +
    usage._count.siteConfigurationLogos;

  await db.fileAsset.update({
    where: { id: fileAssetId },
    data:
      totalRefs === 0
        ? {
            orphanedAt: new Date(),
            lastUsedAt: new Date(),
          }
        : {
            lastUsedAt: new Date(),
          },
  });
}

export async function touchOrMarkFileAssetsOrphaned(fileAssetIds: string[]) {
  await Promise.all(
    fileAssetIds.map((fileAssetId) =>
      touchOrMarkFileAssetOrphaned(prisma, fileAssetId),
    ),
  );
}
