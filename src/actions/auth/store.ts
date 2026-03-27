"use server";

import { CurrentUser } from "@/lib/currentUser";
import { prisma } from "@/lib/prisma";
import { makeSlug } from "@/lib/search/slugify";
import {
  storeFormType,
  storeSchema,
  updateStoreFormType,
} from "@/lib/zodValidation";
import { revalidatePath } from "next/cache";
import { UTApi } from "uploadthing/server";
import { geocodeAddress } from "@/lib/shipping/mapboxGeocode";
import { requireVerifiedEmail } from "@/lib/email-verification/guard";
import { isEmailNotVerifiedError } from "@/lib/email-verification/errors";
import { productImageWithAssetInclude } from "@/lib/product-images";
import { ensureFileAsset } from "@/lib/file-assets";
import { touchOrMarkFileAssetOrphaned } from "@/lib/product-images";

const utapi = new UTApi();
const INVALID_ADDRESS_ERROR = "Please select a valid address from suggestions.";

async function resolveStoreCoordinates(params: {
  address: string;
  location: string;
}) {
  try {
    return await geocodeAddress({
      street: params.address,
      city: params.location,
      country: "",
    });
  } catch {
    return null;
  }
}

export const createStoreAction = async (values: storeFormType) => {
  const user = await CurrentUser();
  if (!user) return { error: "Unauthorized access" };

  try {
    if (user.role !== "SELLER") {
      return { error: "Only sellers can create a store" };
    }

    await requireVerifiedEmail({
      userId: user.id,
      reason: "seller_store_creation",
    });

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
        error:
          "You already created a store. Contact support to reopen your store.",
      };
    }

    if (!user.id) return { error: "Invalid user account" };

    const baseSlug = makeSlug(name);
    const slug = `${baseSlug}-${user.id.slice(0, 6)}`;

    const requiresAddress =
      fulfillmentType === "PHYSICAL" || fulfillmentType === "HYBRID";
    const normalizedAddress = address?.trim() ?? "";

    if (requiresAddress && !normalizedAddress) {
      return { error: "Address is required for physical fulfillment." };
    }

    let latitude: number | null = null;
    let longitude: number | null = null;

    if (requiresAddress) {
      const geocoded = await resolveStoreCoordinates({
        address: normalizedAddress,
        location: location.trim(),
      });

      if (!geocoded) {
        return { error: INVALID_ADDRESS_ERROR };
      }

      latitude = geocoded.latitude;
      longitude = geocoded.longitude;
    }

    await prisma.$transaction(async (tx) => {
      const logoAsset = logo
        ? await ensureFileAsset(tx, {
            uploadedById: user.id,
            url: logo,
            category: "STORE_ASSET",
            kind: "IMAGE",
            isPublic: true,
          })
        : null;

      await tx.store.create({
        data: {
          name,
          description,
          location: location.trim(),
          address: requiresAddress ? normalizedAddress : null,
          latitude,
          longitude,
          logoFileAssetId: logoAsset?.id ?? null,
          type,
          fulfillmentType,
          userId: user.id,
          slug,
          isActive: true,
        },
      });
    });

    revalidatePath("/marketplace/dashboard/seller/store");

    return { success: "Store created successfully!" };
  } catch (error) {
    if (isEmailNotVerifiedError(error)) {
      return {
        error: "Verify your email before creating a store.",
        code: "EMAIL_NOT_VERIFIED",
        requiresEmailVerification: true,
        email: error.email,
      };
    }

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
      return { error: "Unauthorized - not your store" };
    }

    const requiresAddress =
      values.fulfillmentType === "PHYSICAL" ||
      values.fulfillmentType === "HYBRID";
    const nextAddress = values.address?.trim() ?? "";
    const nextLocation = values.location.trim();

    if (requiresAddress && !nextAddress) {
      return { error: "Address is required for physical fulfillment." };
    }

    const addressChanged = (store.address ?? "").trim() !== nextAddress;
    const fulfillmentChanged = store.fulfillmentType !== values.fulfillmentType;
    const missingCoordinates =
      store.latitude === null || store.longitude === null;

    let latitude: number | null = null;
    let longitude: number | null = null;

    if (requiresAddress) {
      if (!addressChanged && !fulfillmentChanged && !missingCoordinates) {
        latitude = store.latitude;
        longitude = store.longitude;
      } else {
        const geocoded = await resolveStoreCoordinates({
          address: nextAddress,
          location: nextLocation,
        });

        if (!geocoded) {
          return { error: INVALID_ADDRESS_ERROR };
        }

        latitude = geocoded.latitude;
        longitude = geocoded.longitude;
      }
    }

    await prisma.$transaction(async (tx) => {
      const existingStore = await tx.store.findUnique({
        where: { id: values.id },
        select: {
          logoFileAssetId: true,
          bannerImageFileAssetId: true,
        },
      });

      const nextLogoAsset = values.logo
        ? await ensureFileAsset(tx, {
            uploadedById: user.id,
            url: values.logo,
            storageKey: values.logoKey ?? null,
            category: "STORE_ASSET",
            kind: "IMAGE",
            isPublic: true,
          })
        : null;

      const nextBannerAsset = values.bannerImage
        ? await ensureFileAsset(tx, {
            uploadedById: user.id,
            url: values.bannerImage,
            storageKey: values.bannerKey ?? null,
            category: "STORE_ASSET",
            kind: "IMAGE",
            isPublic: true,
          })
        : null;

      await tx.store.update({
        where: { id: values.id },
        data: {
          name: values.name,
          description: values.description,
          location: nextLocation,
          address: requiresAddress ? nextAddress : null,
          latitude,
          longitude,
          type: values.type,
          fulfillmentType: values.fulfillmentType,
          tagline: values.tagline ?? null,
          logoFileAssetId: nextLogoAsset?.id ?? null,
          bannerImageFileAssetId: nextBannerAsset?.id ?? null,
          isActive: values.isActive,
          emailNotificationsEnabled: values.emailNotificationsEnabled,
        },
      });

      if (
        existingStore?.logoFileAssetId &&
        existingStore.logoFileAssetId !== nextLogoAsset?.id
      ) {
        await touchOrMarkFileAssetOrphaned(tx, existingStore.logoFileAssetId);
      }

      if (
        existingStore?.bannerImageFileAssetId &&
        existingStore.bannerImageFileAssetId !== nextBannerAsset?.id
      ) {
        await touchOrMarkFileAssetOrphaned(
          tx,
          existingStore.bannerImageFileAssetId,
        );
      }
    });

    revalidatePath("/marketplace/dashboard/seller/store");
    revalidatePath(`/store/${store.slug}`);

    return { success: "Store updated successfully!" };
  } catch (error) {
    console.error("Error updating store:", error);
    return { error: "Something went wrong while updating the store" };
  }
};

export const deleteStoreAction = async (storeId: string) => {
  const user = await CurrentUser();
  if (!user) return { error: "Unauthorized access" };

  try {
    const store = await prisma.store.findUnique({
      where: { id: storeId },
      include: {
        logoFileAsset: {
          select: {
            storageKey: true,
          },
        },
        bannerImageFileAsset: {
          select: {
            storageKey: true,
          },
        },
        products: {
          select: {
            id: true,
            images: {
              include: productImageWithAssetInclude,
            },
          },
        },
        storeGroups: {
          where: {
            status: {
              in: [
                "PENDING",
                "ACCEPTED",
                "PREPARING",
                "READY",
                "DISPATCHED_TO_HUB",
                "ARRIVED_AT_HUB",
                "VERIFIED_AT_HUB",
              ],
            },
          },
          select: { id: true },
        },
      },
    });

    if (!store || store.isDeleted) {
      return { error: "Store not found" };
    }

    if (store.userId !== user.id) {
      return { error: "Unauthorized - not your store" };
    }

    if (store.storeGroups.length > 0) {
      return {
        error:
          "You cannot delete your store while you have active or pending orders.",
      };
    }

    const filesToDelete: string[] = [];

    if (store.logoFileAsset?.storageKey) {
      filesToDelete.push(store.logoFileAsset.storageKey);
    }
    if (store.bannerImageFileAsset?.storageKey) {
      filesToDelete.push(store.bannerImageFileAsset.storageKey);
    }

    store.products.forEach((product) => {
      product.images.forEach((img) => {
        if (img.fileAsset.storageKey) filesToDelete.push(img.fileAsset.storageKey);
      });
    });

    if (filesToDelete.length > 0) {
      try {
        await utapi.deleteFiles(filesToDelete);
      } catch (err) {
        console.warn("Failed to cleanup some store images", err);
      }
    }

    await prisma.$transaction([
      prisma.store.update({
        where: { id: store.id },
        data: {
          isDeleted: true,
          deletedAt: new Date(),
          isActive: false,
        },
      }),
      prisma.product.updateMany({
        where: { storeId: store.id },
        data: {
          isPublished: false,
        },
      }),
    ]);

    revalidatePath("/marketplace/dashboard/seller/store");
    revalidatePath("/marketplace/dashboard/seller/products");
    revalidatePath(`/store/${store.slug}`);

    return { success: "Store deleted successfully" };
  } catch (error) {
    console.error("Error deleting store:", error);
    return { error: "Something went wrong while deleting the store" };
  }
};
