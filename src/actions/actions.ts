"use server";

import { CurrentUser } from "@/lib/currentUser";
import { prisma } from "@/lib/prisma";
import { touchOrMarkFileAssetOrphaned } from "@/lib/product-images";
import { revalidatePath } from "next/cache";
import { UTApi } from "uploadthing/server";

const utapi = new UTApi();

//to delete product images on preview before creating product
export const deleteFileAction = async (keyToDelete: string) => {
  const user = await CurrentUser();
  if (!user) return { error: "Unauthorized access" };

  try {
    await utapi.deleteFiles([keyToDelete]);
    return { success: true };
  } catch (error) {}
};

// delete image from DB and mark the file asset orphaned if nothing else uses it
export const deleteProductImageAction = async (imageId: string) => {
  const user = await CurrentUser();
  if (!user) return { error: "Unauthorized" };

  try {
    const image = await prisma.productImage.findUnique({
      where: { id: imageId },
      select: {
        id: true,
        fileAssetId: true,
      },
    });

    if (!image) return { error: "Image not found" };

    await prisma.$transaction(async (tx) => {
      await tx.productImage.delete({
        where: { id: imageId },
      });

      await touchOrMarkFileAssetOrphaned(tx, image.fileAssetId);
    });

    return { success: true };
  } catch (err) {
    console.error(err);
    return { error: "Could not delete image" };
  }
};

// delete old uploaded profile image
export const deleteUploadedFileAction = async (fileKey: string) => {
  const user = await CurrentUser();
  if (!user) return { error: "Unauthorized access" };

  if (!fileKey) return { error: "Missing file key" };

  try {
    await utapi.deleteFiles([fileKey]);

    return { success: true };
  } catch (error) {
    console.error("Failed to delete file:", error);
    return { error: "Unable to delete file" };
  }
};

//delete store logo
export const deleteLogoAction = async (fileKey: string) => {
  const user = await CurrentUser();
  if (!user) return { error: "Unauthorized access" };
  if (!fileKey) return { error: "Missing file key" };

  try {
    await utapi.deleteFiles([fileKey]);

    const store = await prisma.store.findUnique({
      where: { userId: user.id },
      select: {
        id: true,
        logoFileAssetId: true,
      },
    });

    if (store?.id) {
      await prisma.$transaction(async (tx) => {
        await tx.store.update({
          where: { id: store.id },
          data: { logoFileAssetId: null },
        });

        if (store.logoFileAssetId) {
          await touchOrMarkFileAssetOrphaned(tx, store.logoFileAssetId);
        }
      });
    }

    revalidatePath("/marketplace/dashboard/seller/store");

    return { success: "Logo removed successfully" };
  } catch (error) {
    console.error("Failed to delete file:", error);
    return { error: "Unable to delete file" };
  }
};

//delete store banner
export const deleteBannerAction = async (key: string) => {
  const user = await CurrentUser();
  if (!user) return { error: "Unauthorized access" };

  try {
    await utapi.deleteFiles([key]);

    const store = await prisma.store.findUnique({
      where: { userId: user.id },
      select: {
        id: true,
        bannerImageFileAssetId: true,
      },
    });

    if (store?.id) {
      await prisma.$transaction(async (tx) => {
        await tx.store.update({
          where: { id: store.id },
          data: { bannerImageFileAssetId: null },
        });

        if (store.bannerImageFileAssetId) {
          await touchOrMarkFileAssetOrphaned(tx, store.bannerImageFileAssetId);
        }
      });
    }

    return { success: true };
  } catch (error) {
    console.error("Failed to delete banner", error);
    return { error: "Unable to delete banner" };
  }
};
