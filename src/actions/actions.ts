"use server";
import { CurrentUser } from "@/lib/currentUser";
import { prisma } from "@/lib/prisma";
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

// delete image from DB + UploadThing
export const deleteProductImageAction = async (imageId: string) => {
  const user = await CurrentUser();
  if (!user) return { error: "Unauthorized" };

  try {
    const image = await prisma.productImage.findUnique({
      where: { id: imageId },
    });

    if (!image) return { error: "Image not found" };

    // key comes directly from DB — safest and always correct
    await utapi.deleteFiles([image.imageKey]);

    // 🔥 delete record from DB
    await prisma.productImage.delete({
      where: { id: imageId },
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
    // 1️⃣ Delete from UploadThing
    await utapi.deleteFiles([fileKey]);

    // 2️⃣ Clear logo + logoKey in DB
    await prisma.store.update({
      where: { userId: user.id },
      data: { logo: null, logoKey: null },
    });

    revalidatePath("/market-place/dashboard/seller/store");

    return { success: "Logo removed successfully" };
  } catch (error) {
    console.error("Failed to delete file:", error);
    return { error: "Unable to delete file" };
  }
};

//delete store banner
export const deleteBannerAction = async (key: string) => {
  try {
    await utapi.deleteFiles([key]);
    return { success: true };
  } catch (error) {
    console.error("Failed to delete banner", error);
    return { error: "Unable to delete banner" };
  }
};
