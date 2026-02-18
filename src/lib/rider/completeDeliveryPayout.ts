import { releaseEligibleRiderPayoutForOrder } from "@/lib/cron/releaseEligibleRiderPayouts";

export async function completeDeliveryAndPayRider(orderId: string) {
  return releaseEligibleRiderPayoutForOrder(orderId);
}
