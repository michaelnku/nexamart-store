import { autoAssignRider } from "@/lib/rider/logistics";
import { canAutoAssignForOrderStatus } from "@/lib/rider/types";
import { errorResponse, successResponse } from "./riderDeliveryAction.responses";
import { loadOrderForAutoAssign } from "./riderDeliveryAction.loaders";

export async function runAutoAssignForPaidOrder(orderId: string) {
  const order = await loadOrderForAutoAssign(orderId);

  if (!order) return errorResponse("Order not found");
  if (!order.isPaid) return errorResponse("Order is not paid");
  if (order.delivery) return errorResponse("Delivery already exists");
  if (!canAutoAssignForOrderStatus(order.status)) {
    return errorResponse(`Order status ${order.status} cannot be assigned`);
  }

  await autoAssignRider(orderId);

  return successResponse();
}

