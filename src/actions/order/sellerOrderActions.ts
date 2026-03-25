"use server";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { CurrentRole, CurrentUserId } from "@/lib/currentUser";
import { createOrderTimelineIfMissing } from "@/lib/order/timeline";
import { markSellerGroupReady } from "@/lib/order/markSellerGroupReady";
import { cancelSellerOrder } from "@/lib/orders/cancelSellerOrder";
import { sellerCancelOrderInputSchema } from "@/lib/orders/sellerCancellation";
import {
  assertValidTransition,
  normalizeOrderStatus,
} from "@/lib/order/orderLifecycle";

const SELLER_ORDER_ACTION_ERROR_MESSAGE =
  "We couldn't update this order right now. Please refresh and try again.";

export type SellerOrderActionResult = {
  success?: string;
  error?: string;
  alreadyDone?: boolean;
  warning?: string;
};

function actionSuccess(
  success: string,
  alreadyDone = false,
  warning?: string,
): SellerOrderActionResult {
  return { success, alreadyDone, warning };
}

function actionError(
  error = SELLER_ORDER_ACTION_ERROR_MESSAGE,
): SellerOrderActionResult {
  return { error };
}

export const markSellerDispatchedToHubAction = async (
  sellerGroupId: string,
): Promise<SellerOrderActionResult> => {
  const userId = await CurrentUserId();
  if (!userId) return actionError();

  const role = await CurrentRole();
  if (role !== "SELLER") return actionError();

  try {
    const sellerGroup = await prisma.orderSellerGroup.findUnique({
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

    if (!sellerGroup) return actionError();
    if (sellerGroup.sellerId !== userId) return actionError();
    if (sellerGroup.status === "DISPATCHED_TO_HUB") {
      return actionSuccess("Seller group was already dispatched to the hub.", true);
    }
    if (
      sellerGroup.status === "ARRIVED_AT_HUB" ||
      sellerGroup.status === "VERIFIED_AT_HUB"
    ) {
      return actionSuccess("Seller group was already dispatched to the hub.", true);
    }
    if (sellerGroup.status === "CANCELLED") {
      return actionError();
    }

    if (sellerGroup.order.isFoodOrder) {
      const readyResult = await markSellerGroupReady(sellerGroupId, "MANUAL");

      if (readyResult.reason === "ALREADY_READY") {
        return actionSuccess("Food order was already marked ready for pickup.", true);
      }

      if (readyResult.reason === "NOT_PREPARING") {
        return actionError();
      }

      if (!readyResult.updated) {
        return actionError();
      }

      revalidatePath("/marketplace/dashboard/seller/orders");
      revalidatePath(
        `/marketplace/dashboard/seller/orders/${sellerGroup.orderId}`,
      );
      return actionSuccess(
        "Food order marked ready for rider pickup",
        false,
        readyResult.warningMessage,
      );
    }

    await prisma.$transaction(async (tx) => {
      const normalizedOrderStatus = normalizeOrderStatus(
        sellerGroup.order.status,
      );
      if (normalizedOrderStatus !== "ACCEPTED") {
        assertValidTransition(normalizedOrderStatus, "ACCEPTED");
      }

      await tx.order.update({
        where: { id: sellerGroup.orderId },
        data: { status: "ACCEPTED" },
      });

      await tx.orderSellerGroup.update({
        where: { id: sellerGroupId },
        data: {
          status: "DISPATCHED_TO_HUB",
          expectedAtHub: new Date(Date.now() + 2 * 60 * 60 * 1000),
        },
      });

      await createOrderTimelineIfMissing(
        {
          orderId: sellerGroup.orderId,
          status: "ACCEPTED",
          message: `Seller ${sellerGroup.store.name} has dispatched items to our hub.`,
        },
        tx,
      );
    });

    revalidatePath("/marketplace/dashboard/seller/orders");
    revalidatePath(
      `/marketplace/dashboard/seller/orders/${sellerGroup.orderId}`,
    );
    return actionSuccess("Package dispatched to hub");
  } catch (error) {
    console.error("markSellerDispatchedToHubAction error:", error);
    return actionError();
  }
};

export const acceptOrderAction = async (
  sellerGroupId: string,
  prepTimeMinutes?: number,
): Promise<SellerOrderActionResult> => {
  let userId: string | null = null;

  userId = await CurrentUserId();
  if (!userId) return actionError();

  const role = await CurrentRole();
  if (role !== "SELLER") return actionError();

  try {
    const group = await prisma.orderSellerGroup.findUnique({
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

    if (!group) return actionError();
    if (group.sellerId !== userId) return actionError();

    if (group.order.status === "PENDING_PAYMENT") {
      return actionError();
    }

    if (group.status !== "PENDING") {
      if (
        ["ACCEPTED", "PREPARING", "READY", "DISPATCHED_TO_HUB", "ARRIVED_AT_HUB", "VERIFIED_AT_HUB"].includes(
          group.status,
        )
      ) {
        return actionSuccess("This order was already accepted.", true);
      }
      return actionError();
    }

    if (group.order.isFoodOrder) {
      if (
        !Number.isInteger(prepTimeMinutes) ||
        (prepTimeMinutes as number) < 1 ||
        (prepTimeMinutes as number) > 180
      ) {
        return actionError();
      }
    }

    const prepReadyAt = group.order.isFoodOrder
      ? new Date(Date.now() + (prepTimeMinutes as number) * 60 * 1000)
      : null;

    await prisma.$transaction(async (tx) => {
      const normalizedOrderStatus = normalizeOrderStatus(group.order.status);
      if (normalizedOrderStatus !== "ACCEPTED") {
        assertValidTransition(normalizedOrderStatus, "ACCEPTED");
      }

      await tx.order.update({
        where: { id: group.orderId },
        data: { status: "ACCEPTED" },
      });

      await tx.orderSellerGroup.update({
        where: { id: sellerGroupId },
        data: {
          status: group.order.isFoodOrder ? "PREPARING" : "DISPATCHED_TO_HUB",
          prepTimeMinutes: group.order.isFoodOrder
            ? (prepTimeMinutes as number)
            : null,
          readyAt: prepReadyAt,
        },
      });

      await createOrderTimelineIfMissing(
        {
          orderId: group.orderId,
          status: "ACCEPTED",
          message: `Seller ${group.store.name} accepted and is preparing your items.`,
        },
        tx,
      );

      if (group.order.isFoodOrder && prepReadyAt) {
        await createOrderTimelineIfMissing(
          {
            orderId: group.orderId,
            status: "PREPARING",
            message: `Seller ${group.store.name} started preparing your order. Estimated ready time is ${prepTimeMinutes} minute${prepTimeMinutes === 1 ? "" : "s"}.`,
          },
          tx,
        );
      }

      if (group.order.isFoodOrder && prepReadyAt) {
        await tx.job.upsert({
          where: { id: `mark-ready-${sellerGroupId}` },
          update: {
            type: "MARK_READY",
            status: "PENDING",
            runAt: prepReadyAt,
            attempts: 0,
            lastError: null,
            maxRetries: 5,
            payload: {
              sellerGroupId,
            },
          },
          create: {
            id: `mark-ready-${sellerGroupId}`,
            type: "MARK_READY",
            status: "PENDING",
            runAt: prepReadyAt,
            attempts: 0,
            lastError: null,
            maxRetries: 5,
            payload: {
              sellerGroupId,
            },
          },
        });
      }
    });

    return actionSuccess("Order accepted");
  } catch (error) {
    console.error("acceptOrderAction failed", {
      sellerGroupId,
      sellerId: userId,
      prepTimeMinutes,
      error: error instanceof Error ? error.message : error,
      stack: error instanceof Error ? error.stack : undefined,
    });

    return actionError();
  }
};

export const shipOrderAction = async (sellerGroupId: string) => {
  return markSellerDispatchedToHubAction(sellerGroupId);
};

export const cancelOrderAction = async (input: {
  sellerGroupId: string;
  reason: string;
  note?: string;
}): Promise<SellerOrderActionResult> => {
  let userId: string | null = null;

  try {
    userId = await CurrentUserId();
    if (!userId) return actionError();

    const role = await CurrentRole();
    if (role !== "SELLER") return actionError();

    const parsedInput = sellerCancelOrderInputSchema.safeParse(input);

    if (!parsedInput.success) {
      return actionError();
    }

    const result = await cancelSellerOrder({
      sellerId: userId,
      input: parsedInput.data,
    });

    revalidatePath("/marketplace/dashboard/seller/orders");
    revalidatePath(`/marketplace/dashboard/seller/orders/${result.orderId}`);
    revalidatePath("/marketplace/dashboard/rider/deliveries");
    revalidatePath("/customer/order/history");
    revalidatePath(`/customer/order/${result.orderId}`);
    revalidatePath(`/customer/order/track/${result.orderId}`);

    if (result.trackingNumber) {
      revalidatePath(`/customer/order/track/tn/${result.trackingNumber}`);
    }

    revalidatePath("/");

    return {
      success: result.alreadyCancelled
        ? "Order cancellation was already processed"
        : "Seller cancellation completed successfully",
      alreadyDone: result.alreadyCancelled,
    };
  } catch (error) {
    console.error("cancelOrderAction failed", {
      sellerGroupId: input.sellerGroupId,
      sellerId: userId,
      reason: input.reason,
      error: error instanceof Error ? error.message : error,
      stack: error instanceof Error ? error.stack : undefined,
    });

    return actionError();
  }
};
