import { releaseEligibleRiderPayoutForOrder } from "@/lib/cron/workers/releaseEligibleRiderPayouts";

export async function completeDeliveryAndPayRider(orderId: string) {
  return releaseEligibleRiderPayoutForOrder(orderId);
}
