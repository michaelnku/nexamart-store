import { OrderStatus } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import { moveOrderEarningsToPending } from "@/lib/payout/moveToPendingOnDelivery";
import { ensureOrderPayoutReleaseJobInTx } from "@/lib/payout/orderPayoutRelease";
import { createOrderTimelineIfMissing } from "@/lib/order/timeline";
import {
  assertValidTransition,
  normalizeOrderStatus,
} from "@/lib/order/orderLifecycle";
import { canVerifyDeliveryStatus } from "@/lib/rider/types";
import { getPayoutEligibleAtFrom } from "@/lib/payout/timing";
import { errorResponse, successResponse } from "./riderDeliveryAction.responses";
import { loadDeliveryForOtpVerification } from "./riderDeliveryAction.loaders";

export async function runVerifyDeliveryOtp({
  deliveryId,
  userId,
  otp,
}: {
  deliveryId: string;
  userId: string;
  otp: string;
}) {
  void otp;

  const delivery = await loadDeliveryForOtpVerification(deliveryId);

  if (!delivery) return errorResponse("Delivery not found");
  if (delivery.status === "DELIVERED") {
    return successResponse();
  }
  if (delivery.riderId !== userId) return errorResponse("Not assigned to rider");

  if (!canVerifyDeliveryStatus(delivery.status)) {
    return errorResponse(`Delivery status ${delivery.status} cannot be verified`);
  }

  console.warn("[verifyDeliveryOTPAction] OTP verification temporarily bypassed", {
    deliveryId,
    riderId: userId,
    deliveryStatus: delivery.status,
  });

  const confirmedAt = new Date();
  const payoutEligibleAt = getPayoutEligibleAtFrom(
    confirmedAt,
    Boolean(delivery.order.isFoodOrder),
  );

  try {
    await prisma.$transaction(async (tx) => {
      await tx.delivery.update({
        where: { id: deliveryId },
        data: {
          status: "DELIVERED",
          deliveredAt: confirmedAt,
          payoutEligibleAt,
          payoutLocked: false,
          otpAttempts: 0,
          isLocked: false,
          lockedAt: null,
          otpHash: null,
          otpExpiresAt: null,
        },
      });

      await tx.order.update({
        where: { id: delivery.orderId },
        data: {
          status: (() => {
            const nextStatus: OrderStatus = "DELIVERED";
            assertValidTransition(
              normalizeOrderStatus(delivery.order.status),
              nextStatus,
            );
            return nextStatus;
          })(),
          customerConfirmedAt: confirmedAt,
        },
      });

      await createOrderTimelineIfMissing(
        {
          orderId: delivery.orderId,
          status: "DELIVERED",
          message: "Order delivered successfully.",
        },
        tx,
      );

      await ensureOrderPayoutReleaseJobInTx(tx, {
        orderId: delivery.orderId,
        releaseAt: payoutEligibleAt,
      });
    });

    try {
      const pendingMoveResult = await moveOrderEarningsToPending(delivery.orderId);

      if ("skipped" in pendingMoveResult) {
        console.warn(
          "[verifyDeliveryOTPAction] moveOrderEarningsToPending skipped",
          {
            orderId: delivery.orderId,
            deliveryId,
            reason: pendingMoveResult.reason,
          },
        );
      } else {
        console.info(
          "[verifyDeliveryOTPAction] moveOrderEarningsToPending completed",
          {
            orderId: delivery.orderId,
            deliveryId,
          },
        );
      }
    } catch (err) {
      console.error("[verifyDeliveryOTPAction] moveOrderEarningsToPending failed", {
        orderId: delivery.orderId,
        deliveryId,
        error: err instanceof Error ? err.message : err,
      });
    }

    return successResponse();
  } catch (error) {
    console.error("verifyDeliveryOTPAction failed:", error);
    return errorResponse("Failed to verify OTP. Please try again.");
  }
}

