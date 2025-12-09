"use server";

import { CurrentUserId } from "@/lib/currentUser";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

async function getCartItems(userId: string) {
  const cart = await prisma.cart.findUnique({
    where: { userId },
    include: {
      items: true,
    },
  });
  return cart?.items ?? [];
}

export const addToCartAction = async (
  productId: string,
  variantId?: string | null,
  quantity: number = 1
) => {
  const userId = await CurrentUserId();
  if (!userId) return { error: "Unauthorized" };

  try {
    const cart = await prisma.cart.upsert({
      where: { userId },
      update: {},
      create: { userId },
    });

    const existingItem = await prisma.cartItem.findFirst({
      where: { cartId: cart.id, productId, variantId: variantId ?? null },
    });

    if (existingItem) {
      await prisma.cartItem.update({
        where: { id: existingItem.id },
        data: { quantity: existingItem.quantity + quantity },
      });
    } else {
      await prisma.cartItem.create({
        data: {
          cartId: cart.id,
          productId,
          variantId: variantId ?? null,
          quantity,
        },
      });
    }

    revalidatePath("/cart");
    const updatedItems = await getCartItems(userId);

    return { success: true, items: updatedItems };
  } catch {
    return { error: "Failed to add to cart" };
  }
};

export const removeFromCartAction = async (
  productId: string,
  variantId?: string | null
) => {
  const userId = await CurrentUserId();
  if (!userId) return;

  const cart = await prisma.cart.findUnique({ where: { userId } });
  if (!cart) return;

  await prisma.cartItem.deleteMany({
    where: { cartId: cart.id, productId, variantId: variantId ?? null },
  });

  revalidatePath("/cart");
  const updatedItems = await getCartItems(userId);

  return { success: true, items: updatedItems };
};

export const updateQuantityAction = async (
  productId: string,
  variantId: string | null,
  change: number
) => {
  const userId = await CurrentUserId();
  if (!userId) return;

  const cart = await prisma.cart.findUnique({ where: { userId } });
  if (!cart) return;

  const item = await prisma.cartItem.findFirst({
    where: { cartId: cart.id, productId, variantId: variantId ?? null },
  });

  if (!item) return;

  const newQty = item.quantity + change;

  if (newQty <= 0) {
    await prisma.cartItem.delete({ where: { id: item.id } });
  } else {
    await prisma.cartItem.update({
      where: { id: item.id },
      data: { quantity: newQty },
    });
  }

  revalidatePath("/cart");
  const updatedItems = await getCartItems(userId);

  return { success: true, items: updatedItems };
};
