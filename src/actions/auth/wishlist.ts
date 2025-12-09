"use server";

import { CurrentUserId } from "@/lib/currentUser";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export const toggleWishlistAction = async (productId: string) => {
  const userId = await CurrentUserId();
  if (!userId) return { error: "Login required" };

  try {
    const wishlist = await prisma.wishlist.upsert({
      where: { userId },
      update: {},
      create: { userId },
    });

    const found = await prisma.wishlistItem.findFirst({
      where: { wishlistId: wishlist.id, productId },
    });

    if (found) {
      await prisma.wishlistItem.delete({
        where: { id: found.id },
      });

      revalidatePath("/");
      return { wishlisted: false, success: true };
    }

    await prisma.wishlistItem.create({
      data: { wishlistId: wishlist.id, productId },
    });

    revalidatePath("/");
    return { wishlisted: true, success: true };
  } catch (error) {
    console.error("Wishlist toggle error:", error);
    return { error: "Something went wrong" };
  }
};
