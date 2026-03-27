"use server";

import { revalidatePath } from "next/cache";

import { CurrentRole, CurrentUserId } from "@/lib/currentUser";
import {
  createDisputeEvidenceInTx,
  createDisputeMessageWithAttachmentsInTx,
  createDeliveryEvidenceInTx,
  linkExistingDeliveryEvidenceToDisputeInTx,
} from "@/lib/evidence/service";
import {
  createDeliveryEvidenceSchema,
  createDisputeEvidenceSchema,
  createDisputeMessageSchema,
  linkDeliveryEvidenceSchema,
} from "@/lib/evidence/validation";
import { prisma } from "@/lib/prisma";

async function getEvidenceActorOrThrow() {
  const [userId, role] = await Promise.all([CurrentUserId(), CurrentRole()]);

  if (!userId || !role) {
    throw new Error("Unauthorized");
  }

  return { userId, role };
}

function revalidateEvidenceSurfaces(params: {
  orderId?: string;
  disputeId?: string;
}) {
  if (params.orderId) {
    revalidatePath(`/customer/order/${params.orderId}`);
    revalidatePath(`/marketplace/dashboard/seller/orders/${params.orderId}`);
  }

  if (params.disputeId) {
    revalidatePath(`/marketplace/dashboard/admin/disputes/${params.disputeId}`);
    revalidatePath(`/marketplace/dashboard/seller/disputes/${params.disputeId}`);
  }

  revalidatePath("/marketplace/dashboard/admin/disputes");
  revalidatePath("/marketplace/dashboard/seller/disputes");
  revalidatePath("/marketplace/dashboard/rider/deliveries");
}

export async function createDeliveryEvidenceAction(
  input: Parameters<typeof createDeliveryEvidenceSchema.parse>[0],
) {
  try {
    const actor = await getEvidenceActorOrThrow();
    const parsed = createDeliveryEvidenceSchema.parse(input);

    const result = await prisma.$transaction(async (tx) => {
      const created = await createDeliveryEvidenceInTx(tx, actor, parsed);

      const delivery = await tx.delivery.findUnique({
        where: { id: parsed.deliveryId },
        select: { orderId: true },
      });

      return {
        id: created.id,
        orderId: delivery?.orderId,
      };
    });

    revalidateEvidenceSurfaces({ orderId: result.orderId });
    return { success: true, evidenceId: result.id };
  } catch (error) {
    return {
      error:
        error instanceof Error
          ? error.message
          : "Failed to save delivery evidence.",
    };
  }
}

export async function createDisputeEvidenceAction(
  input: Parameters<typeof createDisputeEvidenceSchema.parse>[0],
) {
  try {
    const actor = await getEvidenceActorOrThrow();
    const parsed = createDisputeEvidenceSchema.parse(input);

    const result = await prisma.$transaction(async (tx) => {
      const created = await createDisputeEvidenceInTx(tx, actor, parsed);
      const dispute = await tx.dispute.findUnique({
        where: { id: parsed.disputeId },
        select: { orderId: true },
      });

      return {
        id: created.id,
        orderId: dispute?.orderId,
      };
    });

    revalidateEvidenceSurfaces({
      orderId: result.orderId,
      disputeId: parsed.disputeId,
    });

    return { success: true, evidenceId: result.id };
  } catch (error) {
    return {
      error:
        error instanceof Error
          ? error.message
          : "Failed to save dispute evidence.",
    };
  }
}

export async function linkDeliveryEvidenceToDisputeAction(
  input: Parameters<typeof linkDeliveryEvidenceSchema.parse>[0],
) {
  try {
    const actor = await getEvidenceActorOrThrow();
    const parsed = linkDeliveryEvidenceSchema.parse(input);

    const result = await prisma.$transaction(async (tx) => {
      const created = await linkExistingDeliveryEvidenceToDisputeInTx(
        tx,
        actor,
        parsed,
      );
      const dispute = await tx.dispute.findUnique({
        where: { id: parsed.disputeId },
        select: { orderId: true },
      });

      return {
        id: created.id,
        orderId: dispute?.orderId,
      };
    });

    revalidateEvidenceSurfaces({
      orderId: result.orderId,
      disputeId: parsed.disputeId,
    });

    return { success: true, evidenceId: result.id };
  } catch (error) {
    return {
      error:
        error instanceof Error
          ? error.message
          : "Failed to link delivery evidence.",
    };
  }
}

export async function createDisputeMessageAction(
  input: Parameters<typeof createDisputeMessageSchema.parse>[0],
) {
  try {
    const actor = await getEvidenceActorOrThrow();
    const parsed = createDisputeMessageSchema.parse(input);

    const result = await prisma.$transaction(async (tx) => {
      const created = await createDisputeMessageWithAttachmentsInTx(
        tx,
        actor,
        parsed,
      );
      const dispute = await tx.dispute.findUnique({
        where: { id: parsed.disputeId },
        select: { orderId: true },
      });

      return {
        id: created.id,
        orderId: dispute?.orderId,
      };
    });

    revalidateEvidenceSurfaces({
      orderId: result.orderId,
      disputeId: parsed.disputeId,
    });

    return { success: true, messageId: result.id };
  } catch (error) {
    return {
      error:
        error instanceof Error
          ? error.message
          : "Failed to post dispute message.",
    };
  }
}
