"use server";

import { markSellerGroupReady } from "@/lib/order/markSellerGroupReady";
import { resolveSellerOrderActionAuth } from "@/lib/orders/seller-actions/sellerOrderAction.auth";
import {
  actionError,
  actionSuccess,
} from "@/lib/orders/seller-actions/sellerOrderAction.responses";
import type { SellerOrderActionResult } from "@/lib/orders/seller-actions/sellerOrderAction.types";
import {
  loadSellerGroupForAccept,
  loadSellerGroupForDispatch,
} from "@/lib/orders/seller-actions/sellerOrderAction.loaders";
import {
  revalidateCancellationPaths,
  revalidateSellerOrderPaths,
} from "@/lib/orders/seller-actions/sellerOrderAction.revalidate";
import { runDispatchToHubFlow } from "@/lib/orders/seller-actions/runDispatchToHubFlow";
import { runFoodAcceptFlow } from "@/lib/orders/seller-actions/runFoodAcceptFlow";
import { runNonFoodAcceptFlow } from "@/lib/orders/seller-actions/runNonFoodAcceptFlow";
import { runSellerCancellation } from "@/lib/orders/seller-actions/runSellerCancellation";
import { validateSellerAcceptInput } from "@/lib/orders/seller-actions/validateSellerAcceptInput";

export type { SellerOrderActionResult };

export const markSellerDispatchedToHubAction = async (
  sellerGroupId: string,
): Promise<SellerOrderActionResult> => {
  const auth = await resolveSellerOrderActionAuth();
  if ("error" in auth) return actionError();

  try {
    const sellerGroup = await loadSellerGroupForDispatch(sellerGroupId);

    if (!sellerGroup) return actionError();
    if (sellerGroup.sellerId !== auth.userId) return actionError();
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

      revalidateSellerOrderPaths(sellerGroup.orderId);
      return actionSuccess(
        "Food order marked ready for rider pickup",
        false,
        readyResult.warningMessage,
      );
    }

    await runDispatchToHubFlow({
      sellerGroupId,
      orderId: sellerGroup.orderId,
      orderStatus: sellerGroup.order.status,
      storeName: sellerGroup.store.name,
    });

    revalidateSellerOrderPaths(sellerGroup.orderId);
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
  const auth = await resolveSellerOrderActionAuth();
  if ("error" in auth) return actionError();

  try {
    const group = await loadSellerGroupForAccept(sellerGroupId);

    if (!group) return actionError();
    if (group.sellerId !== auth.userId) return actionError();

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
      const prepValidation = validateSellerAcceptInput(true, prepTimeMinutes);

      if ("error" in prepValidation) {
        return actionError();
      }

      await runFoodAcceptFlow({
        sellerGroupId,
        orderId: group.orderId,
        orderStatus: group.order.status,
        storeName: group.store.name,
        prepTimeMinutes: prepValidation.prepTimeMinutes,
      });
    } else {
      validateSellerAcceptInput(false, prepTimeMinutes);

      await runNonFoodAcceptFlow({
        sellerGroupId,
        orderId: group.orderId,
        orderStatus: group.order.status,
        storeName: group.store.name,
      });
    }

    return actionSuccess("Order accepted");
  } catch (error) {
    console.error("acceptOrderAction failed", {
      sellerGroupId,
      sellerId: auth.userId,
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
    const auth = await resolveSellerOrderActionAuth();
    if ("error" in auth) return actionError();
    userId = auth.userId;

    const cancellation = await runSellerCancellation({
      sellerId: userId,
      input,
    });

    if ("revalidate" in cancellation && cancellation.revalidate) {
      revalidateCancellationPaths(
        cancellation.revalidate.orderId,
        cancellation.revalidate.trackingNumber,
      );
    }

    return cancellation.result;
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
