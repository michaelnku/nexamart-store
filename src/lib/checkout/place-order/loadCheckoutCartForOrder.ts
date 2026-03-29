import "server-only";

import { prisma } from "@/lib/prisma";
import type { CheckoutCartForOrder } from "./placeOrder.types";

export async function loadCheckoutCartForOrder(
  userId: string,
): Promise<CheckoutCartForOrder | null> {
  return prisma.cart.findUnique({
    where: { userId },
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
                  name: true,
                  userId: true,
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
            select: {
              id: true,
              stock: true,
              priceUSD: true,
              color: true,
              size: true,
            },
          },
        },
      },
    },
  });
}

