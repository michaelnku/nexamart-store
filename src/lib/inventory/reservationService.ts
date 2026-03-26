import {
  InventoryReleaseReason,
  InventoryReservationStatus,
  Prisma,
} from "@/generated/prisma/client";

type Tx = Prisma.TransactionClient;

type InventoryOrderItemRecord = {
  id: string;
  orderId: string;
  sellerGroupId: string | null;
  productId: string;
  variantId: string;
  quantity: number;
  product: {
    isFoodProduct: boolean;
    foodProductConfig: {
      inventoryMode: "STOCK_TRACKED" | "AVAILABILITY_ONLY";
    } | null;
  };
  order: {
    isPaid: boolean;
    // Backward-compatibility bootstrap signal for legacy orders only.
    // InventoryReservation is the long-term source of truth.
    stockDecrementedAt: Date | null;
  };
};

type InventoryReservationRecord = {
  id: string;
  orderId: string;
  orderItemId: string;
  sellerGroupId: string | null;
  variantId: string;
  quantity: number;
  status: InventoryReservationStatus;
};

type ReleaseInventoryOptions = {
  allowCommittedRelease?: boolean;
  reason?: InventoryReleaseReason;
};

function buildReservationKey(orderItemId: string) {
  return `order-item-${orderItemId}`;
}

function aggregateVariantQuantities(
  items: Array<{ variantId: string; quantity: number }>,
): Array<{ variantId: string; quantity: number }> {
  const quantities = new Map<string, number>();

  for (const item of items) {
    quantities.set(
      item.variantId,
      (quantities.get(item.variantId) ?? 0) + item.quantity,
    );
  }

  return [...quantities.entries()]
    .map(([variantId, quantity]) => ({ variantId, quantity }))
    .sort((a, b) => a.variantId.localeCompare(b.variantId));
}

function shouldTrackInventory(item: InventoryOrderItemRecord) {
  if (!item.product.isFoodProduct) {
    return true;
  }

  return item.product.foodProductConfig?.inventoryMode !== "AVAILABILITY_ONLY";
}

async function loadInventoryOrderItemsByOrderId(
  tx: Tx,
  orderId: string,
): Promise<InventoryOrderItemRecord[]> {
  const items = await tx.orderItem.findMany({
    where: {
      orderId,
      variantId: { not: null },
    },
    select: {
      id: true,
      orderId: true,
      sellerGroupId: true,
      productId: true,
      variantId: true,
      quantity: true,
      product: {
        select: {
          isFoodProduct: true,
          foodProductConfig: {
            select: {
              inventoryMode: true,
            },
          },
        },
      },
      order: {
        select: {
          isPaid: true,
          stockDecrementedAt: true,
        },
      },
    },
  });

  return items
    .filter((item): item is typeof item & { variantId: string } => !!item.variantId)
    .map((item) => ({
      id: item.id,
      orderId: item.orderId,
      sellerGroupId: item.sellerGroupId,
      productId: item.productId,
      variantId: item.variantId,
      quantity: item.quantity,
      product: item.product,
      order: item.order,
    }));
}

async function loadInventoryOrderItemsBySellerGroupId(
  tx: Tx,
  sellerGroupId: string,
): Promise<InventoryOrderItemRecord[]> {
  const items = await tx.orderItem.findMany({
    where: {
      sellerGroupId,
      variantId: { not: null },
    },
    select: {
      id: true,
      orderId: true,
      sellerGroupId: true,
      productId: true,
      variantId: true,
      quantity: true,
      product: {
        select: {
          isFoodProduct: true,
          foodProductConfig: {
            select: {
              inventoryMode: true,
            },
          },
        },
      },
      order: {
        select: {
          isPaid: true,
          stockDecrementedAt: true,
        },
      },
    },
  });

  return items
    .filter((item): item is typeof item & { variantId: string } => !!item.variantId)
    .map((item) => ({
      id: item.id,
      orderId: item.orderId,
      sellerGroupId: item.sellerGroupId,
      productId: item.productId,
      variantId: item.variantId,
      quantity: item.quantity,
      product: item.product,
      order: item.order,
    }));
}

async function loadReservationsByOrderItemIds(
  tx: Tx,
  orderItemIds: string[],
): Promise<InventoryReservationRecord[]> {
  if (orderItemIds.length === 0) return [];

  return tx.inventoryReservation.findMany({
    where: {
      orderItemId: { in: orderItemIds },
    },
    select: {
      id: true,
      orderId: true,
      orderItemId: true,
      sellerGroupId: true,
      variantId: true,
      quantity: true,
      status: true,
    },
  });
}

async function decrementVariantStockInTx(
  tx: Tx,
  items: Array<{ variantId: string; quantity: number }>,
) {
  for (const { variantId, quantity } of aggregateVariantQuantities(items)) {
    const updated = await tx.productVariant.updateMany({
      where: {
        id: variantId,
        stock: { gte: quantity },
      },
      data: {
        stock: { decrement: quantity },
      },
    });

    if (updated.count !== 1) {
      throw new Error("Some items are out of stock. Please review your cart.");
    }
  }
}

async function incrementVariantStockInTx(
  tx: Tx,
  items: Array<{ variantId: string; quantity: number }>,
) {
  for (const { variantId, quantity } of aggregateVariantQuantities(items)) {
    await tx.productVariant.update({
      where: { id: variantId },
      data: {
        stock: { increment: quantity },
      },
    });
  }
}

async function createReservationsWithoutStockMutationInTx(
  tx: Tx,
  items: InventoryOrderItemRecord[],
  status: InventoryReservationStatus,
  reason?: InventoryReleaseReason,
) {
  if (items.length === 0) return;

  const now = new Date();

  await tx.inventoryReservation.createMany({
    data: items.map((item) => ({
      orderId: item.orderId,
      orderItemId: item.id,
      sellerGroupId: item.sellerGroupId,
      productId: item.productId,
      variantId: item.variantId,
      quantity: item.quantity,
      status,
      reservationKey: buildReservationKey(item.id),
      // Backward-compatibility bootstrap for legacy rows created before
      // InventoryReservation existed. The reservation row is now authoritative.
      committedAt: status === "COMMITTED" ? item.order.stockDecrementedAt ?? now : null,
      releasedAt: status === "RELEASED" ? now : null,
      releaseReason: status === "RELEASED" ? reason ?? "SYSTEM_RECOVERY" : null,
    })),
  });
}

async function ensureReservationsForCommitInTx(
  tx: Tx,
  items: InventoryOrderItemRecord[],
): Promise<InventoryReservationRecord[]> {
  const existingReservations = await loadReservationsByOrderItemIds(
    tx,
    items.map((item) => item.id),
  );
  const existingByOrderItemId = new Map(
    existingReservations.map((reservation) => [reservation.orderItemId, reservation]),
  );
  const missingItems = items.filter((item) => !existingByOrderItemId.has(item.id));

  if (missingItems.length > 0) {
    const shouldBootstrapCommittedReservations = missingItems.some(
      (item) => item.order.isPaid || item.order.stockDecrementedAt !== null,
    );

    if (shouldBootstrapCommittedReservations) {
      await createReservationsWithoutStockMutationInTx(
        tx,
        missingItems,
        "COMMITTED",
      );
    } else {
      await reserveOrderInventoryInTx(tx, missingItems[0].orderId, {
        orderItems: items,
      });
    }
  }

  return loadReservationsByOrderItemIds(
    tx,
    items.map((item) => item.id),
  );
}

async function ensureReservationsForReleaseInTx(
  tx: Tx,
  items: InventoryOrderItemRecord[],
  reason: InventoryReleaseReason,
): Promise<InventoryReservationRecord[]> {
  const existingReservations = await loadReservationsByOrderItemIds(
    tx,
    items.map((item) => item.id),
  );
  const existingByOrderItemId = new Map(
    existingReservations.map((reservation) => [reservation.orderItemId, reservation]),
  );
  const missingItems = items.filter((item) => !existingByOrderItemId.has(item.id));

  if (missingItems.length > 0) {
    const stockWasPreviouslyConsumed = missingItems.some(
      (item) => item.order.isPaid || item.order.stockDecrementedAt !== null,
    );

    await createReservationsWithoutStockMutationInTx(
      tx,
      missingItems,
      stockWasPreviouslyConsumed ? "COMMITTED" : "RELEASED",
      stockWasPreviouslyConsumed ? undefined : reason,
    );
  }

  return loadReservationsByOrderItemIds(
    tx,
    items.map((item) => item.id),
  );
}

export async function reserveOrderInventoryInTx(
  tx: Tx,
  orderId: string,
  options?: {
    orderItems?: InventoryOrderItemRecord[];
  },
) {
  const items = options?.orderItems ?? (await loadInventoryOrderItemsByOrderId(tx, orderId));
  const trackedItems = items.filter(shouldTrackInventory);

  if (trackedItems.length === 0) {
    return { reservedCount: 0, alreadyReservedCount: 0 };
  }

  const existingReservations = await loadReservationsByOrderItemIds(
    tx,
    trackedItems.map((item) => item.id),
  );
  const existingByOrderItemId = new Map(
    existingReservations.map((reservation) => [reservation.orderItemId, reservation]),
  );

  const itemsToReserve = trackedItems.filter((item) => {
    const existing = existingByOrderItemId.get(item.id);

    if (!existing) return true;
    if (existing.status === "RELEASED") {
      throw new Error("Inventory reservation has already been released.");
    }

    return false;
  });

  if (itemsToReserve.length === 0) {
    return {
      reservedCount: 0,
      alreadyReservedCount: existingReservations.length,
    };
  }

  await decrementVariantStockInTx(tx, itemsToReserve);

  await tx.inventoryReservation.createMany({
    data: itemsToReserve.map((item) => ({
      orderId: item.orderId,
      orderItemId: item.id,
      sellerGroupId: item.sellerGroupId,
      productId: item.productId,
      variantId: item.variantId,
      quantity: item.quantity,
      status: "RESERVED",
      reservationKey: buildReservationKey(item.id),
    })),
  });

  return {
    reservedCount: itemsToReserve.length,
    alreadyReservedCount: existingReservations.length,
  };
}

export async function commitOrderInventoryInTx(tx: Tx, orderId: string) {
  const items = await loadInventoryOrderItemsByOrderId(tx, orderId);
  const trackedItems = items.filter(shouldTrackInventory);

  if (trackedItems.length === 0) {
    return { committedCount: 0, alreadyCommittedCount: 0 };
  }

  const reservations = await ensureReservationsForCommitInTx(tx, trackedItems);
  const releasedReservations = reservations.filter(
    (reservation) => reservation.status === "RELEASED",
  );

  if (releasedReservations.length > 0) {
    throw new Error("Inventory reservation has already been released.");
  }

  const now = new Date();
  const reservationsToCommit = reservations.filter(
    (reservation) => reservation.status === "RESERVED",
  );

  if (reservationsToCommit.length > 0) {
    const updated = await tx.inventoryReservation.updateMany({
      where: {
        id: { in: reservationsToCommit.map((reservation) => reservation.id) },
        status: "RESERVED",
      },
      data: {
        status: "COMMITTED",
        committedAt: now,
        releasedAt: null,
        releaseReason: null,
      },
    });

    if (updated.count !== reservationsToCommit.length) {
      throw new Error(
        "Inventory reservation commit failed due to a concurrent state change.",
      );
    }
  }

  await tx.order.updateMany({
    where: {
      id: orderId,
      // Legacy recovery signal only; reservations now carry the durable state.
      stockDecrementedAt: null,
    },
    data: {
      stockDecrementedAt: now,
    },
  });

  return {
    committedCount: reservationsToCommit.length,
    alreadyCommittedCount: reservations.length - reservationsToCommit.length,
  };
}

async function releaseReservationsInTx(
  tx: Tx,
  reservations: InventoryReservationRecord[],
  options: Required<ReleaseInventoryOptions>,
) {
  const reservationsToRelease = reservations.filter((reservation) =>
    options.allowCommittedRelease
      ? reservation.status === "RESERVED" || reservation.status === "COMMITTED"
      : reservation.status === "RESERVED",
  );

  if (
    !options.allowCommittedRelease &&
    reservations.some((reservation) => reservation.status === "COMMITTED")
  ) {
    throw new Error(
      "Committed inventory cannot be released by this cancellation path.",
    );
  }

  if (reservationsToRelease.length === 0) {
    return {
      releasedCount: 0,
      alreadyReleasedCount: reservations.filter(
        (reservation) => reservation.status === "RELEASED",
      ).length,
    };
  }

  const releasedAt = new Date();
  const updated = await tx.inventoryReservation.updateMany({
    where: {
      id: { in: reservationsToRelease.map((reservation) => reservation.id) },
      status: {
        in: options.allowCommittedRelease
          ? ["RESERVED", "COMMITTED"]
          : ["RESERVED"],
      },
    },
    data: {
      status: "RELEASED",
      releasedAt,
      releaseReason: options.reason,
    },
  });

  if (updated.count !== reservationsToRelease.length) {
    throw new Error(
      "Inventory reservation release failed due to a concurrent state change.",
    );
  }

  await incrementVariantStockInTx(tx, reservationsToRelease);

  return {
    releasedCount: reservationsToRelease.length,
    alreadyReleasedCount: reservations.filter(
      (reservation) => reservation.status === "RELEASED",
    ).length,
  };
}

export async function releaseOrderInventoryInTx(
  tx: Tx,
  orderId: string,
  options?: ReleaseInventoryOptions,
) {
  const items = await loadInventoryOrderItemsByOrderId(tx, orderId);
  const trackedItems = items.filter(shouldTrackInventory);

  if (trackedItems.length === 0) {
    return { releasedCount: 0, alreadyReleasedCount: 0 };
  }

  const reservations = await ensureReservationsForReleaseInTx(
    tx,
    trackedItems,
    options?.reason ?? "ORDER_CANCELLED",
  );

  return releaseReservationsInTx(tx, reservations, {
    allowCommittedRelease: options?.allowCommittedRelease ?? false,
    reason: options?.reason ?? "ORDER_CANCELLED",
  });
}

export async function releaseSellerGroupInventoryInTx(
  tx: Tx,
  sellerGroupId: string,
  options?: ReleaseInventoryOptions,
) {
  const items = await loadInventoryOrderItemsBySellerGroupId(tx, sellerGroupId);
  const trackedItems = items.filter(shouldTrackInventory);

  if (trackedItems.length === 0) {
    return { releasedCount: 0, alreadyReleasedCount: 0 };
  }

  const reservations = await ensureReservationsForReleaseInTx(
    tx,
    trackedItems,
    options?.reason ?? "SELLER_CANCELLATION",
  );

  return releaseReservationsInTx(tx, reservations, {
    allowCommittedRelease: options?.allowCommittedRelease ?? false,
    reason: options?.reason ?? "SELLER_CANCELLATION",
  });
}
