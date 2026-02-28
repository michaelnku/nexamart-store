"use server";

import { Prisma } from "@/generated/prisma";
import { CurrentUser } from "@/lib/currentUser";
import { prisma } from "@/lib/prisma";
import { heroBannerSchema, HeroBannerInput } from "@/lib/zodValidation";
import { revalidatePath } from "next/cache";
import { UTApi } from "uploadthing/server";

const utapi = new UTApi();
export const deleteHeroBannerImageAvatarAction = async () => {
  const user = await CurrentUser();
  if (!user) return { error: "Unauthorized" };

  try {
    const dbUser = await prisma.user.findUnique({
      where: { id: user.id },
      select: { profileAvatar: true },
    });

    if (!dbUser?.profileAvatar) return { error: "No profile avatar to delete" };

    const avatar = dbUser.profileAvatar as {
      key?: string;
    };

    if (!avatar.key) {
      await prisma.user.update({
        where: { id: user.id },
        data: {
          profileAvatar: Prisma.JsonNull,
        },
      });

      return { success: true };
    }

    await utapi.deleteFiles([avatar.key]);

    await prisma.user.update({
      where: { id: user.id },
      data: {
        profileAvatar: Prisma.JsonNull,
      },
    });

    return { success: true };
  } catch (err) {
    console.error(err);
    return { error: "Could not delete profile image" };
  }
};

export const createHeroBannerAction = async (values: HeroBannerInput) => {
  const user = await CurrentUser();
  if (!user || user.role !== "ADMIN") {
    return { error: "Unauthorized access" };
  }

  const normalizedValues: HeroBannerInput = {
    ...values,
    subtitle: values.subtitle?.trim() || "",
    ctaText: values.ctaText?.trim() || "",
    ctaLink: values.ctaLink?.trim() || "",
    productImage: values.productImage || "",
    lottieUrl: values.lottieUrl || "",
  };

  const parsed = heroBannerSchema.safeParse(normalizedValues);

  if (!parsed.success) {
    return { error: "Invalid banner data" };
  }

  const {
    title,
    subtitle,
    ctaText,
    ctaLink,
    backgroundImage,
    productImage,
    lottieUrl,
    position,
    placement,
    isActive,
    startsAt,
    endsAt,
  } = parsed.data;

  await prisma.heroBanner.create({
    data: {
      title,
      subtitle: subtitle || null,
      ctaText: ctaText || null,
      ctaLink: ctaLink || null,
      backgroundImage,
      productImage: productImage || null,
      lottieUrl: lottieUrl || null,
      position,
      placement,
      isActive,
      startsAt: startsAt ?? null,
      endsAt: endsAt ?? null,
    },
  });

  revalidatePath("/");
  revalidatePath("/admin/marketing/hero-banners");

  return { success: "Hero banner created successfully!" };
};
export const updateHeroBannerAction = async (
  id: string,
  values: HeroBannerInput,
) => {
  const user = await CurrentUser();
  if (!user || user.role !== "ADMIN") {
    return { error: "Unauthorized access" };
  }

  const parsed = heroBannerSchema.safeParse(values);

  if (!parsed.success) {
    return { error: "Invalid banner data" };
  }

  const data = parsed.data;

  await prisma.heroBanner.update({
    where: { id },
    data: {
      ...data,
      subtitle: data.subtitle || null,
      ctaText: data.ctaText || null,
      ctaLink: data.ctaLink || null,
      productImage: data.productImage || null,
      lottieUrl: data.lottieUrl || null,
      startsAt: data.startsAt ?? null,
      endsAt: data.endsAt ?? null,
    },
  });

  revalidatePath("/");
  revalidatePath("/admin/marketing/hero-banners");

  return { success: "Hero banner updated successfully!" };
};

export const deleteHeroBannerAction = async (id: string) => {
  const user = await CurrentUser();
  if (!user || user.role !== "ADMIN") {
    return { error: "Unauthorized access" };
  }

  await prisma.heroBanner.update({
    where: { id },
    data: {
      isDeleted: true,
      isActive: false,
    },
  });

  revalidatePath("/");
  revalidatePath("/admin/marketing/hero-banners");

  return { success: "Hero banner deleted successfully!" };
};
