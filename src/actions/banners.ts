"use server";

import { Prisma, UserRole } from "@/generated/prisma";
import { CurrentUser } from "@/lib/currentUser";
import { createAuditLog } from "@/lib/audit/service";
import { prisma } from "@/lib/prisma";
import { JsonFile } from "@/lib/types";
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

  const banner = await prisma.heroBanner.create({
    data: {
      title: data.title,
      subtitle: data.subtitle || null,
      ctaText: data.ctaText || null,
      ctaLink: data.ctaLink || null,

      backgroundImage: data.backgroundImage as Prisma.JsonObject,
      productImage: data.productImage
        ? (data.productImage as Prisma.JsonObject)
        : Prisma.JsonNull,

      lottieUrl: data.lottieUrl || null,
      position: data.position,
      placement: data.placement,
      isActive: data.isActive,
      startsAt: data.startsAt ?? null,
      endsAt: data.endsAt ?? null,
    },
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
  });

  if (!existing) return { error: "Banner not found" };

  const parsed = heroBannerSchema.safeParse(values);
  if (!parsed.success) return { error: "Invalid banner data" };

  const data = parsed.data;

  const existingBg = existing.backgroundImage as JsonFile | null;

  if (existingBg?.key && existingBg.key !== data.backgroundImage?.key) {
    await utapi.deleteFiles(existingBg.key);
  }

  await prisma.heroBanner.update({
    where: { id },
    data: {
      title: data.title,
      subtitle: data.subtitle || null,
      ctaText: data.ctaText || null,
      ctaLink: data.ctaLink || null,
      backgroundImage: data.backgroundImage as Prisma.JsonObject,
      productImage: data.productImage
        ? (data.productImage as Prisma.JsonObject)
        : Prisma.JsonNull,
      lottieUrl: data.lottieUrl || null,
      position: data.position,
      placement: data.placement,
      isActive: data.isActive,
      startsAt: data.startsAt ?? null,
      endsAt: data.endsAt ?? null,
    },
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
  });

  if (!banner) return { error: "Banner not found" };

  const bg = banner.backgroundImage as Partial<JsonFile> | null;
  const product = banner.productImage as Partial<JsonFile> | null;

  if (bg?.key) {
    await utapi.deleteFiles(bg.key);
  }

  if (product?.key) {
    await utapi.deleteFiles(product.key);
  }

  await prisma.heroBanner.delete({
    where: { id },
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
