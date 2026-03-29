import { completeDeliveryAndPayRider } from "@/lib/rider/completeDeliveryPayout";
import { errorResponse } from "./riderDeliveryAction.responses";

export async function runCompleteDeliveryAndPayRider(orderId: string) {
  try {
    const result = await completeDeliveryAndPayRider(orderId);
    return result;
  } catch (error: unknown) {
    const message =
      error instanceof Error
        ? error.message
        : "Failed to complete delivery payout";
    return errorResponse(message);
  }
}

