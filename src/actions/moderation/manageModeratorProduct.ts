"use server";

import { revalidatePath } from "next/cache";
import { createAuditLog } from "@/lib/audit/service";
import { prisma } from "@/lib/prisma";
import { requireModerator } from "@/lib/moderation/guardModerator";

type ModeratorProductAction = "unpublish" | "republish";

export async function manageModeratorProductAction(
  productId: string,
  action: ModeratorProductAction,
) {
  const currentUser = await requireModerator();

  await prisma.$transaction(async (tx) => {
    const product = await tx.product.findUnique({
      where: { id: productId },
      select: { id: true, isPublished: true, name: true, storeId: true },
    });

    if (!product) {
      throw new Error("Product not found.");
    }

    if (action === "unpublish") {
      if (!product.isPublished) {
        throw new Error("Product is already unpublished.");
      }

      await tx.product.update({
        where: { id: productId },
        data: {
          isPublished: false,
        },
      });

      await createAuditLog(
        {
          actorId: currentUser.id,
          actorRole: currentUser.role,
          actionType: "PRODUCT_MODERATION_UNPUBLISHED",
          targetEntityType: "PRODUCT",
          targetEntityId: product.id,
          summary: `Moderator unpublished product ${product.id}.`,
          metadata: {
            productName: product.name,
            storeId: product.storeId,
          },
        },
        tx,
      );
    }

    if (action === "republish") {
      if (product.isPublished) {
        throw new Error("Product is already published.");
      }

      await tx.product.update({
        where: { id: productId },
        data: {
          isPublished: true,
        },
      });

      await createAuditLog(
        {
          actorId: currentUser.id,
          actorRole: currentUser.role,
          actionType: "PRODUCT_MODERATION_REPUBLISHED",
          targetEntityType: "PRODUCT",
          targetEntityId: product.id,
          summary: `Moderator republished product ${product.id}.`,
          metadata: {
            productName: product.name,
            storeId: product.storeId,
          },
        },
        tx,
      );
    }
  });

  revalidatePath("/marketplace/dashboard/moderator/products");
  revalidatePath(`/marketplace/dashboard/moderator/products/${productId}`);

  return {
    message:
      action === "unpublish"
        ? "Product unpublished."
        : "Product republished.",
  };
}
