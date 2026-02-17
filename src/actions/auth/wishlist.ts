"use server";

import { CurrentUserId } from "@/lib/currentUser";
import { prisma } from "@/lib/prisma";
import { FullProduct } from "@/lib/types";
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

export async function getWishlistAction(): Promise<FullProduct[]> {
  const userId = await CurrentUserId();
  if (!userId) return [];

  const wishlist = await prisma.wishlist.findUnique({
    where: { userId },
    include: {
      items: {
        include: {
          product: {
            include: {
              images: true,
              variants: true,
              store: {
                select: {
                  id: true,
                  userId: true,
                  name: true,
                  slug: true,
                  logo: true,
                },
              },
              category: { select: { id: true, name: true } },
              reviews: {
                include: {
                  user: { select: { id: true, name: true, image: true } },
                },
              },
            },
          },
        },
      },
    },
  });

  if (!wishlist) return [];

  // Return only the products
  return wishlist.items.map((item) => item.product);
}

export const moveAllWishlistToCartAction = async () => {
  const userId = await CurrentUserId();
  if (!userId) return { error: "Login required" };

  try {
    const wishlist = await prisma.wishlist.findUnique({
      where: { userId },
      include: {
        items: {
          select: {
            id: true,
            productId: true,
            product: {
              select: {
                store: { select: { type: true } },
                variants: { select: { id: true, priceUSD: true } },
              },
            },
          },
        },
      },
    });

    if (!wishlist || wishlist.items.length === 0) {
      return { success: true, movedCount: 0 };
    }

    const incomingHasFood = wishlist.items.some(
      (item) => item.product.store.type === "FOOD",
    );
    const incomingHasNonFood = wishlist.items.some(
      (item) => item.product.store.type !== "FOOD",
    );

    if (incomingHasFood && incomingHasNonFood) {
      return {
        error:
          "Cannot move all items. Your wishlist has both food and non-food products.",
      };
    }

    const cart = await prisma.cart.upsert({
      where: { userId },
      update: {},
      create: { userId },
    });

    const cartItems = await prisma.cartItem.findMany({
      where: { cartId: cart.id },
      include: { product: { include: { store: true } } },
    });

    if (cartItems.length > 0) {
      const cartHasFood = cartItems.some((i) => i.product.store.type === "FOOD");
      const cartHasNonFood = cartItems.some(
        (i) => i.product.store.type !== "FOOD",
      );

      if (
        (cartHasFood && incomingHasNonFood) ||
        (cartHasNonFood && incomingHasFood)
      ) {
        return {
          error:
            "Cannot move all items. You cannot mix food and non-food products in one cart.",
        };
      }
    }

    await prisma.$transaction(async (tx) => {
      for (const item of wishlist.items) {
        const cheapestVariant = item.product.variants.sort(
          (a, b) => a.priceUSD - b.priceUSD,
        )[0];

        const variantId = cheapestVariant?.id ?? null;

        const existingItem = await tx.cartItem.findFirst({
          where: {
            cartId: cart.id,
            productId: item.productId,
            variantId,
          },
        });

        if (existingItem) {
          await tx.cartItem.update({
            where: { id: existingItem.id },
            data: { quantity: { increment: 1 } },
          });
        } else {
          await tx.cartItem.create({
            data: {
              cartId: cart.id,
              productId: item.productId,
              variantId,
              quantity: 1,
            },
          });
        }
      }

      await tx.wishlistItem.deleteMany({
        where: {
          id: { in: wishlist.items.map((item) => item.id) },
        },
      });
    });

    revalidatePath("/cart");
    revalidatePath("/customer/wishlist");

    return { success: true, movedCount: wishlist.items.length };
  } catch (error) {
    console.error("Move all wishlist to cart error:", error);
    return { error: "Failed to move wishlist items to cart" };
  }
};
