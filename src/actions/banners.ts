"use server";

import { Prisma } from "@/generated/prisma";
import { CurrentUser } from "@/lib/currentUser";
import { prisma } from "@/lib/prisma";
import { heroBannerSchema, HeroBannerInput } from "@/lib/zodValidation";
import { revalidatePath } from "next/cache";
import { UTApi } from "uploadthing/server";

const utapi = new UTApi();

export const createHeroBannerAction = async (values: HeroBannerInput) => {
  const user = await CurrentUser();
  if (!user || user.role !== "ADMIN") {
    return { error: "Unauthorized access" };
  }

  const parsed = heroBannerSchema.safeParse(values);
  if (!parsed.success) {
    return { error: "Invalid banner data" };
  }

  const data = parsed.data;

  await prisma.heroBanner.create({
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

  revalidatePath("/");
  revalidatePath("/marketplace/dashboard/admin/marketing/banners");

  return { success: "Hero banner created successfully!" };
};

export const deleteHeroBannerImageAction = async (key: string) => {
  const user = await CurrentUser();
  if (!user || user.role !== "ADMIN") {
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
  if (!user || user.role !== "ADMIN") {
    return { error: "Unauthorized access" };
  }

  const existing = await prisma.heroBanner.findUnique({
    where: { id },
  });

  if (!existing) return { error: "Banner not found" };

  const parsed = heroBannerSchema.safeParse(values);
  if (!parsed.success) return { error: "Invalid banner data" };

  const data = parsed.data;

  const existingBg = existing.backgroundImage as {
    url: string;
    key: string;
  } | null;

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

  revalidatePath("/");
  revalidatePath("/marketplace/dashboard/admin/marketing/banners");

  return { success: "Hero banner updated successfully!" };
};

export const deleteHeroBannerAction = async (id: string) => {
  const user = await CurrentUser();
  if (!user || user.role !== "ADMIN") {
    return { error: "Unauthorized access" };
  }

  const banner = await prisma.heroBanner.findUnique({
    where: { id },
  });

  if (!banner) return { error: "Banner not found" };

  const bg = banner.backgroundImage as { key?: string } | null;
  const product = banner.productImage as { key?: string } | null;

  if (bg?.key) {
    await utapi.deleteFiles(bg.key);
  }

  if (product?.key) {
    await utapi.deleteFiles(product.key);
  }

  await prisma.heroBanner.delete({
    where: { id },
  });

  revalidatePath("/");
  revalidatePath("/marketplace/dashboard/admin/marketing/banners");

  return { success: "Banner deleted successfully" };
};
