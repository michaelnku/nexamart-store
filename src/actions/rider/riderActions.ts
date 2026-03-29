"use server";

import {
  requireAdminUserId,
  requireRiderUserId,
  requireVerifiedRiderUserId,
} from "@/lib/rider/actions/riderDeliveryAction.auth";
import { runAutoAssignForPaidOrder } from "@/lib/rider/actions/runAutoAssignForPaidOrder";
import { runRiderAcceptDelivery } from "@/lib/rider/actions/runRiderAcceptDelivery";
import { runRiderCancelAssignedDelivery } from "@/lib/rider/actions/runRiderCancelAssignedDelivery";
import { runVerifyDeliveryOtp } from "@/lib/rider/actions/runVerifyDeliveryOtp";
import { runCompleteDeliveryAndPayRider } from "@/lib/rider/actions/runCompleteDeliveryAndPayRider";
import { loadRiderDeliveriesView } from "@/lib/rider/actions/loadRiderDeliveriesView";

export async function autoAssignRiderForPaidOrderAction(orderId: string) {
  const auth = await requireAdminUserId();
  if ("error" in auth) return auth;

  return runAutoAssignForPaidOrder(orderId);
}

export async function riderAcceptDeliveryAction(deliveryId: string) {
  const auth = await requireVerifiedRiderUserId();
  if ("error" in auth) return auth;

  return runRiderAcceptDelivery({
    deliveryId,
    userId: auth.userId,
  });
}

export async function riderCancelAssignedDeliveryAction(deliveryId: string) {
  const auth = await requireRiderUserId();
  if ("error" in auth) return auth;

  return runRiderCancelAssignedDelivery({
    deliveryId,
    userId: auth.userId,
  });
}

export async function verifyDeliveryOTPAction(deliveryId: string, otp: string) {
  const auth = await requireRiderUserId();
  if ("error" in auth) return auth;

  return runVerifyDeliveryOtp({
    deliveryId,
    userId: auth.userId,
    otp,
  });
}

export async function riderVerifyDeliveryOtpAction(
  deliveryId: string,
  otp: string,
) {
  return verifyDeliveryOTPAction(deliveryId, otp);
}

export async function completeDeliveryAndPayRiderAction(orderId: string) {
  const auth = await requireAdminUserId();
  if ("error" in auth) return auth;

  return runCompleteDeliveryAndPayRider(orderId);
}

export async function getRiderDeliveriesAction(statusKey?: string) {
  const auth = await requireRiderUserId();
  if ("error" in auth) return auth;

  return loadRiderDeliveriesView({
    userId: auth.userId,
    statusKey,
  });
}
