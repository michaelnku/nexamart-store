import "server-only";

import { Prisma } from "@/generated/prisma";
import { prisma } from "@/lib/prisma";

const checkoutPreviewCartQuery = Prisma.validator<Prisma.CartDefaultArgs>()({
  include: {
    items: {
      include: {
        cartItemSelectedOptions: {
          select: {
            optionGroupId: true,
            optionId: true,
          },
        },
        product: {
          include: {
            store: {
              select: {
                id: true,
                shippingRatePerMile: true,
                latitude: true,
                longitude: true,
                type: true,
              },
            },
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
          select: { id: true, priceUSD: true, stock: true },
        },
      },
    },
  },
});

export type CheckoutPreviewCart = Prisma.CartGetPayload<
  typeof checkoutPreviewCartQuery
>;

export async function loadCheckoutPreviewCart(
  userId: string,
): Promise<CheckoutPreviewCart | null> {
  return prisma.cart.findUnique({
    where: { userId },
    ...checkoutPreviewCartQuery,
  });
}
