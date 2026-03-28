"use server";

import { revalidatePath } from "next/cache";

import { CurrentRole, CurrentUserId } from "@/lib/currentUser";
import { createRiderDeliveryEvidenceInTx } from "@/lib/evidence/service";
import { createRiderDeliveryEvidenceSchema } from "@/lib/evidence/validation";
import { prisma } from "@/lib/prisma";

export async function createRiderDeliveryEvidenceAction(
  input: Parameters<typeof createRiderDeliveryEvidenceSchema.parse>[0],
) {
  try {
    const [userId, role] = await Promise.all([CurrentUserId(), CurrentRole()]);

    if (!userId || role !== "RIDER") {
      throw new Error("Unauthorized");
    }

    const parsed = createRiderDeliveryEvidenceSchema.parse(input);

    const result = await prisma.$transaction(async (tx) => {
      const created = await createRiderDeliveryEvidenceInTx(tx, {
        userId,
        role,
      }, parsed);

      const delivery = await tx.delivery.findUnique({
        where: { id: parsed.deliveryId },
        select: { id: true, orderId: true },
      });

      return {
        evidenceId: created.id,
        deliveryId: delivery?.id,
        orderId: delivery?.orderId,
      };
    });

    if (result.deliveryId) {
      revalidatePath(
        `/marketplace/dashboard/rider/deliveries/${result.deliveryId}`,
      );
    }

    if (result.orderId) {
      revalidatePath(`/customer/order/${result.orderId}`);
      revalidatePath(`/marketplace/dashboard/seller/orders/${result.orderId}`);
    }

    revalidatePath("/marketplace/dashboard/rider/deliveries");

    return { success: true, evidenceId: result.evidenceId };
  } catch (error) {
    return {
      error:
        error instanceof Error
          ? error.message
          : "Failed to save rider delivery evidence.",
    };
  }
}
