"use server";

import { SenderType } from "@/generated/prisma/client";
import { CurrentUserId } from "@/lib/currentUser";
import { prisma } from "@/lib/prisma";
import {
  persistConversationMessage,
  processConversationMessageAfterWrite,
} from "@/lib/inbox/conversationService";
import { revalidatePath } from "next/cache";

const ACTIVE_INQUIRY_STATUSES = ["OPEN", "WAITING"] as const;

export async function startProductInquiryConversationAction({
  productId,
  message,
}: {
  productId: string;
  message: string;
}) {
  const buyerId = await CurrentUserId();
  if (!buyerId) return { error: "Unauthorized" };

  const content = message.trim();
  if (!content) return { error: "Message cannot be empty" };

  const product = await prisma.product.findUnique({
    where: { id: productId },
    select: {
      id: true,
      name: true,
      isPublished: true,
      store: {
        select: {
          id: true,
          name: true,
          userId: true,
          type: true,
          isDeleted: true,
          isSuspended: true,
        },
      },
    },
  });

  if (!product || !product.store) {
    return { error: "Product not found" };
  }

  if (product.store.type !== "FOOD") {
    return { error: "Store questions are only available for food products" };
  }

  if (!product.isPublished || product.store.isDeleted || product.store.isSuspended) {
    return { error: "This product is not available for questions" };
  }

  const sellerId = product.store.userId;
  if (!sellerId) {
    return { error: "Store owner could not be resolved" };
  }

  if (sellerId === buyerId) {
    return { error: "You cannot message your own store" };
  }

  const { conversationId, createdMessage } = await prisma.$transaction(
    async (tx) => {
      const existing = await tx.conversation.findFirst({
        where: {
          type: "PRODUCT_INQUIRY",
          userId: buyerId,
          storeId: product.store.id,
          productId: product.id,
          status: {
            in: [...ACTIVE_INQUIRY_STATUSES],
          },
          members: {
            some: {
              userId: sellerId,
            },
          },
        },
        select: {
          id: true,
        },
      });

      const conversationId =
        existing?.id ??
        (
          await tx.conversation.create({
            data: {
              userId: buyerId,
              type: "PRODUCT_INQUIRY",
              status: "OPEN",
              subject: product.name,
              storeId: product.store.id,
              productId: product.id,
              members: {
                create: [{ userId: buyerId }, { userId: sellerId }],
              },
            },
            select: {
              id: true,
            },
          })
        ).id;

      const createdMessage = await persistConversationMessage(tx, {
        conversationId,
        senderId: buyerId,
        senderType: SenderType.USER,
        content,
      });

      return {
        conversationId,
        createdMessage,
      };
    },
  );

  await processConversationMessageAfterWrite(createdMessage, {
    publish: true,
  });
  revalidatePath("/messages");

  return {
    ok: true,
    conversationId,
  };
}
