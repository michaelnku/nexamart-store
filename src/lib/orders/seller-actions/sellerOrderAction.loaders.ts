import "server-only";

import { prisma } from "@/lib/prisma";

export async function loadSellerGroupForDispatch(sellerGroupId: string) {
  return prisma.orderSellerGroup.findUnique({
    where: { id: sellerGroupId },
    select: {
      id: true,
      orderId: true,
      sellerId: true,
      status: true,
      store: {
        select: { name: true },
      },
      order: {
        select: { isFoodOrder: true, status: true },
      },
    },
  });
}

export async function loadSellerGroupForAccept(sellerGroupId: string) {
  return prisma.orderSellerGroup.findUnique({
    where: { id: sellerGroupId },
    select: {
      id: true,
      sellerId: true,
      store: { select: { name: true } },
      status: true,
      orderId: true,
      order: {
        select: {
          isFoodOrder: true,
          status: true,
        },
      },
    },
  });
}

