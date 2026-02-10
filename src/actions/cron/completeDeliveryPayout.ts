import { completeDeliveryAndPayRider } from "@/lib/rider/completeDeliveryPayout";

export async function completeDeliveryAndPayRiderCron(orderId: string) {
  return completeDeliveryAndPayRider(orderId);
}
