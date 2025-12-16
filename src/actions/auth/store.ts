"use server";

import { CurrentUser } from "@/lib/currentUser";
import { prisma } from "@/lib/prisma";
import { makeSlug } from "@/lib/slugify";
import {
  storeFormType,
  storeSchema,
  updateStoreFormType,
} from "@/lib/zodValidation";
import { revalidatePath } from "next/cache";
import { UTApi } from "uploadthing/server";

const utapi = new UTApi();

export const createStoreAction = async (values: storeFormType) => {
  const user = await CurrentUser();
  if (!user) return { error: "Unauthorized access" };

  try {
    if (user.role !== "SELLER") {
      return { error: "Only sellers can create a store" };
    }

    const validated = storeSchema.safeParse(values);
    if (!validated.success) return { error: "Invalid store data" };

    const {
      name,
      description,
      location,
      logo,
      type,
      fulfillmentType,
      address,
    } = validated.data;

    if (type === "FOOD" && fulfillmentType === "DIGITAL") {
      return {
        error: "Food stores cannot be digital-only.",
      };
    }

    const existingStore = await prisma.store.findUnique({
      where: { userId: user.id },
    });

    if (existingStore) {
      return {
        error: "You already created a store. You can't create more than one.",
      };
    }

    if (!user.id) return { error: "Invalid user account" };

    const baseSlug = makeSlug(name);
    const slug = `${baseSlug}-${user.id.slice(0, 6)}`;

    const requiresAddress =
      fulfillmentType === "PHYSICAL" || fulfillmentType === "HYBRID";

    if (requiresAddress && !address) {
      return { error: "Address is required for physical fulfillment." };
    }

    await prisma.store.create({
      data: {
        name,
        description,
        location: location.trim(),
        address: requiresAddress ? address ?? null : null,
        logo,
        type,
        fulfillmentType,
        userId: user.id,
        slug: slug,
        isActive: true,
      },
    });

    revalidatePath("/market-place/dashboard/seller/store");

    return { success: "Store created successfully!" };
  } catch (error) {
    console.error("Error creating store", error);
    return { error: "Something went wrong while creating the store" };
  }
};

export const UpdateStoreAction = async (values: updateStoreFormType) => {
  const user = await CurrentUser();
  if (!user) return { error: "Unauthorized access" };

  try {
    const store = await prisma.store.findUnique({
      where: { id: values.id },
    });

    if (!store) return { error: "Store not found" };

    if (store.userId !== user.id) {
      return { error: "Unauthorized — not your store" };
    }

    const newLogoUrl = values.logo;
    const isLogoChanged = newLogoUrl && newLogoUrl !== store.logo;

    if (isLogoChanged && store.logoKey) {
      try {
        await utapi.deleteFiles([store.logoKey]);
      } catch {
        console.error("⚠ Failed to delete previous logo from UploadThing");
      }
    }

    const newBannerUrl = values.bannerImage;
    const bannerChanged = newBannerUrl && newBannerUrl !== store.bannerImage;
    if (bannerChanged && store.bannerKey) {
      try {
        await utapi.deleteFiles([store.bannerKey]);
      } catch {
        console.warn("⚠ Failed to delete previous banner");
      }
    }

    // Update DB
    await prisma.store.update({
      where: { id: values.id },
      data: {
        name: values.name,
        description: values.description,
        location: values.location.trim(),
        address: values.address ?? null,
        type: values.type,
        tagline: values.tagline ?? null,

        logo: newLogoUrl ?? null,
        logoKey: values.logoKey ?? null,

        bannerImage: values.bannerImage ?? null,
        bannerKey: values.bannerKey ?? null,

        isActive: values.isActive,
        emailNotificationsEnabled: values.emailNotificationsEnabled,
      },
    });

    revalidatePath("/market-place/dashboard/seller/store");
    revalidatePath(`/store/${store.slug}`);

    return { success: "Store updated successfully!" };
  } catch (error) {
    console.error("Error updating store:", error);
    return { error: "Something went wrong while updating the store" };
  }
};
