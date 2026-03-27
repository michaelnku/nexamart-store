import { CurrentUser } from "@/lib/currentUser";
import { prisma } from "@/lib/prisma";
import { touchOrMarkFileAssetOrphaned } from "@/lib/product-images";
import { revalidatePath } from "next/cache";
import { UTApi } from "uploadthing/server";

const utapi = new UTApi();

export const removeHeroBannerBackgroundImageAction = async (id: string) => {
  const user = await CurrentUser();
  if (!user || user.role !== "ADMIN") {
    return { error: "Unauthorized access" };
  }

  const banner = await prisma.heroBanner.findUnique({
    where: { id },
    select: {
      backgroundImageFileAssetId: true,
      backgroundImageFileAsset: {
        select: {
          storageKey: true,
        },
      },
    },
  });

  if (!banner) return { error: "Banner not found" };

  if (banner.backgroundImageFileAsset?.storageKey) {
    await utapi.deleteFiles(banner.backgroundImageFileAsset.storageKey);
  }

  await prisma.$transaction(async (tx) => {
    await tx.heroBanner.update({
      where: { id },
      data: {
        backgroundImageFileAssetId: null,
      },
    });

    if (banner.backgroundImageFileAssetId) {
      await touchOrMarkFileAssetOrphaned(tx, banner.backgroundImageFileAssetId);
    }
  });

  revalidatePath("/");
  revalidatePath("/admin/marketing/hero-banners");

  return { success: "Background image removed" };
};
