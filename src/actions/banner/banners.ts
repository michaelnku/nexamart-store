"use server";

import { UserRole } from "@/generated/prisma";
import { CurrentUser } from "@/lib/currentUser";
import { createAuditLog } from "@/lib/audit/service";
import { ensureFileAsset } from "@/lib/file-assets";
import {
  heroBannerMediaInclude,
} from "@/lib/media-views";
import { prisma } from "@/lib/prisma";
import { touchOrMarkFileAssetOrphaned } from "@/lib/product-images";
import { heroBannerSchema, HeroBannerInput } from "@/lib/zodValidation";
import { revalidatePath } from "next/cache";
import { UTApi } from "uploadthing/server";

const utapi = new UTApi();

export const createHeroBannerAction = async (values: HeroBannerInput) => {
  const user = await CurrentUser();
  if (!user || user.role !== UserRole.ADMIN) {
    return { error: "Unauthorized access" };
  }

  const parsed = heroBannerSchema.safeParse(values);
  if (!parsed.success) {
    return { error: "Invalid banner data" };
  }

  const data = parsed.data;

  const banner = await prisma.$transaction(async (tx) => {
    const backgroundAsset = data.backgroundImage
      ? await ensureFileAsset(tx, {
          uploadedById: user.id,
          file: data.backgroundImage,
          category: "OTHER",
          kind: "IMAGE",
          isPublic: true,
        })
      : null;

    const productAsset = data.productImage
      ? await ensureFileAsset(tx, {
          uploadedById: user.id,
          file: data.productImage,
          category: "OTHER",
          kind: "IMAGE",
          isPublic: true,
        })
      : null;

    return tx.heroBanner.create({
      data: {
        title: data.title,
        subtitle: data.subtitle || null,
        ctaText: data.ctaText || null,
        ctaLink: data.ctaLink || null,
        backgroundImageFileAssetId: backgroundAsset?.id ?? null,
        productImageFileAssetId: productAsset?.id ?? null,
        lottieUrl: data.lottieUrl || null,
        position: data.position,
        placement: data.placement,
        isActive: data.isActive,
        startsAt: data.startsAt ?? null,
        endsAt: data.endsAt ?? null,
      },
      include: heroBannerMediaInclude,
    });
  });

  await createAuditLog({
    actorId: user.id,
    actorRole: user.role,
    actionType: "HERO_BANNER_CREATED",
    targetEntityType: "HERO_BANNER",
    targetEntityId: banner.id,
    summary: `Created hero banner${data.title ? `: ${data.title}` : "."}`,
    metadata: {
      title: data.title || null,
      placement: data.placement,
      isActive: data.isActive,
      position: data.position,
    },
  });

  revalidatePath("/");
  revalidatePath("/marketplace/dashboard/admin/marketing/banners");

  return { success: "Hero banner created successfully!" };
};

export const deleteHeroBannerImageAction = async (key: string) => {
  const user = await CurrentUser();
  if (!user || user.role !== UserRole.ADMIN) {
    return { error: "Unauthorized access" };
  }

  await utapi.deleteFiles(key);

  return { success: true };
};

export const updateHeroBannerAction = async (
  id: string,
  values: HeroBannerInput,
) => {
  const user = await CurrentUser();
  if (!user || user.role !== UserRole.ADMIN) {
    return { error: "Unauthorized access" };
  }

  const existing = await prisma.heroBanner.findUnique({
    where: { id },
    include: heroBannerMediaInclude,
  });

  if (!existing) return { error: "Banner not found" };

  const parsed = heroBannerSchema.safeParse(values);
  if (!parsed.success) return { error: "Invalid banner data" };

  const data = parsed.data;

  await prisma.$transaction(async (tx) => {
    const nextBackgroundAsset =
      data.backgroundImage === undefined
        ? undefined
        : data.backgroundImage
          ? await ensureFileAsset(tx, {
              uploadedById: user.id,
              file: data.backgroundImage,
              category: "OTHER",
              kind: "IMAGE",
              isPublic: true,
            })
          : null;

    const nextProductAsset =
      data.productImage === undefined
        ? undefined
        : data.productImage
          ? await ensureFileAsset(tx, {
              uploadedById: user.id,
              file: data.productImage,
              category: "OTHER",
              kind: "IMAGE",
              isPublic: true,
            })
          : null;

    await tx.heroBanner.update({
      where: { id },
      data: {
        title: data.title,
        subtitle: data.subtitle || null,
        ctaText: data.ctaText || null,
        ctaLink: data.ctaLink || null,
        backgroundImageFileAssetId:
          nextBackgroundAsset === undefined
            ? undefined
            : nextBackgroundAsset?.id ?? null,
        productImageFileAssetId:
          nextProductAsset === undefined ? undefined : nextProductAsset?.id ?? null,
        lottieUrl: data.lottieUrl || null,
        position: data.position,
        placement: data.placement,
        isActive: data.isActive,
        startsAt: data.startsAt ?? null,
        endsAt: data.endsAt ?? null,
      },
    });

    if (
      existing.backgroundImageFileAssetId &&
      existing.backgroundImageFileAssetId !== nextBackgroundAsset?.id
    ) {
      await touchOrMarkFileAssetOrphaned(
        tx,
        existing.backgroundImageFileAssetId,
      );
    }

    if (
      existing.productImageFileAssetId &&
      existing.productImageFileAssetId !== nextProductAsset?.id
    ) {
      await touchOrMarkFileAssetOrphaned(tx, existing.productImageFileAssetId);
    }
  });

  await createAuditLog({
    actorId: user.id,
    actorRole: user.role,
    actionType: "HERO_BANNER_UPDATED",
    targetEntityType: "HERO_BANNER",
    targetEntityId: id,
    summary: `Updated hero banner${data.title ? `: ${data.title}` : "."}`,
    metadata: {
      title: data.title || null,
      placement: data.placement,
      isActive: data.isActive,
      position: data.position,
    },
  });

  revalidatePath("/");
  revalidatePath("/marketplace/dashboard/admin/marketing/banners");

  return { success: "Hero banner updated successfully!" };
};

export const deleteHeroBannerAction = async (id: string) => {
  const user = await CurrentUser();
  if (!user || user.role !== UserRole.ADMIN) {
    return { error: "Unauthorized access" };
  }

  const banner = await prisma.heroBanner.findUnique({
    where: { id },
    include: heroBannerMediaInclude,
  });

  if (!banner) return { error: "Banner not found" };

  const bgKey = banner.backgroundImageFileAsset?.storageKey;
  const productKey = banner.productImageFileAsset?.storageKey;

  if (bgKey) {
    await utapi.deleteFiles(bgKey);
  }

  if (productKey) {
    await utapi.deleteFiles(productKey);
  }

  await prisma.$transaction(async (tx) => {
    await tx.heroBanner.delete({
      where: { id },
    });

    if (banner.backgroundImageFileAssetId) {
      await touchOrMarkFileAssetOrphaned(tx, banner.backgroundImageFileAssetId);
    }

    if (banner.productImageFileAssetId) {
      await touchOrMarkFileAssetOrphaned(tx, banner.productImageFileAssetId);
    }
  });

  await createAuditLog({
    actorId: user.id,
    actorRole: user.role,
    actionType: "HERO_BANNER_DELETED",
    targetEntityType: "HERO_BANNER",
    targetEntityId: id,
    summary: `Deleted hero banner${banner.title ? `: ${banner.title}` : "."}`,
    metadata: {
      title: banner.title || null,
      placement: banner.placement,
    },
  });

  revalidatePath("/");
  revalidatePath("/marketplace/dashboard/admin/marketing/banners");

  return { success: "Banner deleted successfully" };
};

export const toggleHeroBannerActiveAction = async (
  id: string,
  isActive: boolean,
) => {
  const user = await CurrentUser();
  if (!user || user.role !== UserRole.ADMIN) {
    return { error: "Unauthorized access" };
  }

  const banner = await prisma.heroBanner.findUnique({
    where: { id },
    select: {
      id: true,
      title: true,
      isDeleted: true,
    },
  });

  if (!banner || banner.isDeleted) {
    return { error: "Banner not found" };
  }

  await prisma.heroBanner.update({
    where: { id },
    data: { isActive },
  });

  await createAuditLog({
    actorId: user.id,
    actorRole: user.role,
    actionType: "HERO_BANNER_STATUS_CHANGED",
    targetEntityType: "HERO_BANNER",
    targetEntityId: id,
    summary: `${isActive ? "Activated" : "Disabled"} hero banner${banner.title ? `: ${banner.title}` : "."}`,
    metadata: {
      isActive,
    },
  });

  revalidatePath("/");
  revalidatePath("/marketplace/dashboard/admin/marketing");
  revalidatePath("/marketplace/dashboard/admin/marketing/banners");

  return { success: true };
};

export const moveHeroBannerPositionAction = async (
  id: string,
  direction: "up" | "down",
) => {
  const user = await CurrentUser();
  if (!user || user.role !== UserRole.ADMIN) {
    return { error: "Unauthorized access" };
  }

  const currentBanner = await prisma.heroBanner.findUnique({
    where: { id },
    select: {
      id: true,
      title: true,
      position: true,
      placement: true,
      isDeleted: true,
    },
  });

  if (!currentBanner || currentBanner.isDeleted) {
    return { error: "Banner not found" };
  }

  const banners = await prisma.heroBanner.findMany({
    where: {
      isDeleted: false,
      placement: currentBanner.placement,
    },
    orderBy: [{ position: "asc" }, { createdAt: "asc" }],
    select: {
      id: true,
      title: true,
      position: true,
      placement: true,
    },
  });

  const currentIndex = banners.findIndex((banner) => banner.id === id);
  if (currentIndex === -1) {
    return { error: "Banner not found" };
  }

  const swapIndex = direction === "up" ? currentIndex - 1 : currentIndex + 1;
  if (swapIndex < 0 || swapIndex >= banners.length) {
    return { success: true };
  }

  const swapBanner = banners[swapIndex];

  await prisma.$transaction([
    prisma.heroBanner.update({
      where: { id: currentBanner.id },
      data: { position: swapBanner.position },
    }),
    prisma.heroBanner.update({
      where: { id: swapBanner.id },
      data: { position: currentBanner.position },
    }),
  ]);

  await createAuditLog({
    actorId: user.id,
    actorRole: user.role,
    actionType: "HERO_BANNER_REORDERED",
    targetEntityType: "HERO_BANNER",
    targetEntityId: id,
    summary: `Moved hero banner ${direction}${currentBanner.title ? `: ${currentBanner.title}` : "."}`,
    metadata: {
      direction,
      placement: currentBanner.placement,
      previousPosition: currentBanner.position,
      newPosition: swapBanner.position,
      swappedWithId: swapBanner.id,
    },
  });

  revalidatePath("/");
  revalidatePath("/marketplace/dashboard/admin/marketing");
  revalidatePath("/marketplace/dashboard/admin/marketing/banners");

  return { success: true };
};
