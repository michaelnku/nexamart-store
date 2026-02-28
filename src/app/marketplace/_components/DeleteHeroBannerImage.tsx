import { Prisma } from "@/generated/prisma";
import { CurrentUser } from "@/lib/currentUser";
import { prisma } from "@/lib/prisma";
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
  });

  if (!banner) return { error: "Banner not found" };

  const bg = banner.backgroundImage as { url: string; key: string } | null;

  if (bg?.key) {
    await utapi.deleteFiles(bg.key);
  }

  await prisma.heroBanner.update({
    where: { id },
    data: {
      backgroundImage: Prisma.JsonNull,
    },
  });

  revalidatePath("/");
  revalidatePath("/admin/marketing/hero-banners");

  return { success: "Background image removed" };
};
