"use server";

import { CurrentRole, CurrentUserId } from "@/lib/currentUser";
import { prisma } from "@/lib/prisma";
import { addOrderTimelineOnce } from "@/lib/order/timeline";
import { evaluateOrderForDispatch } from "@/lib/order/evaluateOrderForDispatch";
import { revalidatePath } from "next/cache";

export async function confirmSellerGroupArrivedAtHubAction(
  hubInboundCode: string,
  moderatorId: string,
) {
  const role = await CurrentRole();
  if (role !== "MODERATOR") return { error: "Forbidden" };

  const currentUserId = await CurrentUserId();
  if (!currentUserId || currentUserId !== moderatorId) {
    return { error: "Invalid moderator session" };
  }

  const group = await prisma.orderSellerGroup.findUnique({
    where: { hubInboundCode },
    select: {
      id: true,
      orderId: true,
      status: true,
      store: {
        select: { name: true },
      },
      order: {
        select: { isFoodOrder: true },
      },
    },
  });

  if (!group) return { error: "Seller group not found" };
  if (group.order.isFoodOrder) {
    return { error: "Food orders do not use hub intake flow." };
  }
  if (group.status !== "IN_TRANSIT_TO_HUB") {
    return { error: "Only in-transit hub shipments can be confirmed." };
  }

  await prisma.$transaction(async (tx) => {
    await tx.orderSellerGroup.update({
      where: { id: group.id },
      data: {
        status: "ARRIVED_AT_HUB",
        verified: true,
        arrivedAtHub: new Date(),
      },
    });

    await addOrderTimelineOnce(
      {
        orderId: group.orderId,
        status: "SHIPPED",
        message: `Items from ${group.store.name} have arrived at our fulfillment hub.`,
      },
      tx,
    );
  });

  await evaluateOrderForDispatch(group.orderId);

  revalidatePath("/marketplace/dashboard/moderator");
  revalidatePath("/marketplace/dashboard/seller/orders");
  revalidatePath(`/marketplace/dashboard/seller/orders/${group.orderId}`);
  revalidatePath("/customer/order/history");
  revalidatePath(`/customer/order/track/${group.orderId}`);

  return { success: true };
}
