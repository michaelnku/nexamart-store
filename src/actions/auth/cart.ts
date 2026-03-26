"use server";

import { CurrentUserId } from "@/lib/currentUser";
import { getCartAvailabilityError } from "@/lib/inventory/cartAvailability";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import {
  assertAvailabilityOnlyFoodCanBeOrdered,
  buildFoodSelectionFingerprint,
  type FoodSelectionInput,
  validateFoodSelections,
} from "@/lib/food/ordering";

async function getCartItems(userId: string) {
  const cart = await prisma.cart.findUnique({
    where: { userId },
    include: {
      items: {
        select: {
          id: true,
          productId: true,
          variantId: true,
          selectionFingerprint: true,
          quantity: true,
        },
      },
    },
  });
  return cart?.items ?? [];
}

export async function getCart(userId: string) {
  return prisma.cart.findUnique({
    where: { userId },
    include: {
      items: true,
    },
  });
}

export const addToCartAction = async (
  productId: string,
  variantId?: string | null,
  quantity = 1,
  selectedOptions: FoodSelectionInput[] = [],
) => {
  const userId = await CurrentUserId();
  if (!userId) return { error: "Unauthorized" };
  if (!variantId) return { error: "Please select a product variant." };

  try {
    const product = await prisma.product.findUnique({
      where: { id: productId },
      select: {
        id: true,
        name: true,
        isFoodProduct: true,
        store: { select: { type: true } },
        foodProductConfig: {
          select: {
            inventoryMode: true,
            isAvailable: true,
            isSoldOut: true,
            dailyOrderLimit: true,
            availableFrom: true,
            availableUntil: true,
            availableDays: true,
          },
        },
        foodOptionGroups: {
          where: { isActive: true },
          select: {
            id: true,
            name: true,
            type: true,
            isRequired: true,
            minSelections: true,
            maxSelections: true,
            isActive: true,
            options: {
              select: {
                id: true,
                name: true,
                priceDeltaUSD: true,
                isAvailable: true,
                stock: true,
              },
            },
          },
        },
      },
    });

    if (!product) return { error: "Product not found" };
    if (!product.isFoodProduct && selectedOptions.length > 0) {
      return { error: "Selected options are only supported for food items." };
    }

    const variant = await prisma.productVariant.findFirst({
      where: { id: variantId, productId },
      select: { id: true, stock: true },
    });

    if (!variant) return { error: "Invalid product variant." };

    const cart = await prisma.cart.upsert({
      where: { userId },
      update: {},
      create: { userId },
    });

    const cartItems = await prisma.cartItem.findMany({
      where: { cartId: cart.id },
      include: { product: { select: { store: { select: { type: true } } } } },
    });

    if (cartItems.length > 0) {
      const hasFood = cartItems.some((item) => item.product.store.type === "FOOD");
      const hasNonFood = cartItems.some(
        (item) => item.product.store.type !== "FOOD",
      );
      const newIsFood = product.store.type === "FOOD";

      if ((hasFood && !newIsFood) || (hasNonFood && newIsFood)) {
        return {
          error: "Food items must be ordered separately for faster delivery.",
        };
      }
    }

    const validatedSelections = product.isFoodProduct
      ? validateFoodSelections({
          product,
          selections: selectedOptions,
          quantity,
        })
      : {
          snapshots: [],
          optionsPriceUSD: 0,
          selectionFingerprint: "",
        };

    const selectionFingerprint = product.isFoodProduct
      ? validatedSelections.selectionFingerprint
      : buildFoodSelectionFingerprint([]);

    const existingItem = await prisma.cartItem.findFirst({
      where: {
        cartId: cart.id,
        productId,
        variantId,
        selectionFingerprint,
      },
    });

    const requestedQuantity = (existingItem?.quantity ?? 0) + quantity;

    if (product.isFoodProduct) {
      await assertAvailabilityOnlyFoodCanBeOrdered(prisma, product, requestedQuantity);
    }

    if (
      !product.isFoodProduct ||
      product.foodProductConfig?.inventoryMode === "STOCK_TRACKED"
    ) {
      const stockError = getCartAvailabilityError({
        stock: variant.stock,
        requestedQuantity,
      });

      if (stockError) {
        return { error: stockError };
      }
    }

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
          variantId,
          quantity,
          selectionFingerprint,
          cartItemSelectedOptions: validatedSelections.snapshots.length
            ? {
                createMany: {
                  data: validatedSelections.snapshots.map((selection) => ({
                    optionGroupId: selection.optionGroupId,
                    optionId: selection.optionId,
                    optionGroupName: selection.optionGroupName,
                    optionName: selection.optionName,
                    priceDeltaUSD: selection.priceDeltaUSD,
                  })),
                },
              }
            : undefined,
        },
      });
    }

    revalidatePath("/cart");
    const updatedItems = await getCartItems(userId);

    return { success: true, items: updatedItems };
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to add to cart";
    return { error: message };
  }
};

export const removeFromCartAction = async (cartItemId: string) => {
  const userId = await CurrentUserId();
  if (!userId) return;

  await prisma.cartItem.deleteMany({
    where: { id: cartItemId, cart: { userId } },
  });

  revalidatePath("/cart");
  const updatedItems = await getCartItems(userId);

  return { ok: true, items: updatedItems };
};

export const updateQuantityAction = async (cartItemId: string, change: number) => {
  const userId = await CurrentUserId();
  if (!userId) return;

  const item = await prisma.cartItem.findFirst({
    where: { id: cartItemId, cart: { userId } },
    include: {
      product: {
        select: {
          id: true,
          name: true,
          isFoodProduct: true,
          foodProductConfig: {
            select: {
              inventoryMode: true,
              isAvailable: true,
              isSoldOut: true,
              dailyOrderLimit: true,
              availableFrom: true,
              availableUntil: true,
              availableDays: true,
            },
          },
          foodOptionGroups: {
            where: { isActive: true },
            select: {
              id: true,
              name: true,
              type: true,
              isRequired: true,
              minSelections: true,
              maxSelections: true,
              isActive: true,
              options: {
                select: {
                  id: true,
                  name: true,
                  priceDeltaUSD: true,
                  isAvailable: true,
                  stock: true,
                },
              },
            },
          },
        },
      },
      variant: {
        select: { stock: true },
      },
      cartItemSelectedOptions: {
        select: {
          optionGroupId: true,
          optionId: true,
        },
      },
    },
  });

  if (!item) return;

  const newQty = item.quantity + change;

  if (newQty <= 0) {
    await prisma.cartItem.delete({ where: { id: item.id } });
  } else {
    if (item.product.isFoodProduct) {
      validateFoodSelections({
        product: item.product,
        selections: item.cartItemSelectedOptions,
        quantity: newQty,
      });

      await assertAvailabilityOnlyFoodCanBeOrdered(prisma, item.product, newQty);
    }

    if (
      item.variant &&
      (!item.product.isFoodProduct ||
        item.product.foodProductConfig?.inventoryMode === "STOCK_TRACKED")
    ) {
      const stockError = getCartAvailabilityError({
        stock: item.variant.stock,
        requestedQuantity: newQty,
      });

      if (stockError) {
        return { error: stockError };
      }
    }

    await prisma.cartItem.update({
      where: { id: item.id },
      data: { quantity: newQty },
    });
  }

  revalidatePath("/cart");
  const updatedItems = await getCartItems(userId);

  return { success: true, items: updatedItems };
};
