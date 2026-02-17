"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { CurrentUserId } from "@/lib/currentUser";

export async function createReviewAction({
  productId,
  rating,
  comment,
}: {
  productId: string;
  rating: number;
  comment?: string;
}) {
  const userId = await CurrentUserId();
  if (!userId) throw new Error("Unauthorized");

  if (rating < 1 || rating > 5) {
    throw new Error("Rating must be between 1 and 5");
  }

  // Prevent duplicate review by same user for same product.
  const existing = await prisma.review.findFirst({
    where: {
      productId,
      userId,
    },
  });

  if (existing) {
    throw new Error("You already reviewed this product");
  }

  // Verify successful purchase.
  const validOrder = await prisma.order.findFirst({
    where: {
      userId,
      isPaid: true,
      status: {
        in: ["DELIVERED", "COMPLETED"],
      },
      items: {
        some: {
          productId,
        },
      },
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  if (!validOrder) {
    throw new Error(
      "You can only review products you have successfully received",
    );
  }

  // Create review and update product rating atomically.
  await prisma.$transaction(async (tx) => {
    await tx.review.create({
      data: {
        productId,
        userId,
        orderId: validOrder.id,
        rating,
        comment,
      },
    });

    const stats = await tx.review.aggregate({
      where: { productId },
      _avg: { rating: true },
      _count: true,
    });

    await tx.product.update({
      where: { id: productId },
      data: {
        averageRating: stats._avg.rating ?? 0,
        reviewCount: stats._count,
      },
    });
  });

  revalidatePath("/customer/reviewsratings");
  revalidatePath("/products");
  revalidatePath("/products/[slug]", "page");

  return { success: true };
}

