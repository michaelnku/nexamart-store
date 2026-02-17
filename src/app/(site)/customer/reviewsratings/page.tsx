import { prisma } from "@/lib/prisma";
import { CurrentUserId } from "@/lib/currentUser";
import ReviewsRatingsContent from "@/components/reviews/ReviewsRatingsContent";

export default async function ReviewsRatingsPage() {
  const userId = await CurrentUserId();

  if (!userId) {
    return (
      <main className="max-w-5xl mx-auto px-4 py-12">
        <p className="text-center text-gray-500 text-lg">
          Login required to manage your reviews.
        </p>
      </main>
    );
  }

  const [eligibleOrders, myReviews] = await Promise.all([
    prisma.order.findMany({
      where: {
        userId,
        isPaid: true,
        status: {
          in: ["DELIVERED", "COMPLETED"],
        },
      },
      orderBy: {
        createdAt: "desc",
      },
      select: {
        id: true,
        createdAt: true,
        items: {
          select: {
            productId: true,
            product: {
              select: {
                id: true,
                name: true,
                images: {
                  select: {
                    imageUrl: true,
                  },
                  take: 1,
                },
              },
            },
          },
        },
      },
    }),
    prisma.review.findMany({
      where: {
        userId,
      },
      orderBy: {
        createdAt: "desc",
      },
      select: {
        id: true,
        productId: true,
        rating: true,
        comment: true,
        createdAt: true,
        product: {
          select: {
            name: true,
          },
        },
      },
    }),
  ]);

  const reviewedProductIds = new Set(myReviews.map((review) => review.productId));

  const pendingProductsMap = new Map<
    string,
    {
      productId: string;
      productName: string;
      imageUrl: string;
      orderId: string;
      orderedAt: string;
    }
  >();

  for (const order of eligibleOrders) {
    for (const item of order.items) {
      if (reviewedProductIds.has(item.productId)) continue;
      if (pendingProductsMap.has(item.productId)) continue;

      pendingProductsMap.set(item.productId, {
        productId: item.product.id,
        productName: item.product.name,
        imageUrl: item.product.images[0]?.imageUrl ?? "/placeholder.png",
        orderId: order.id,
        orderedAt: order.createdAt.toISOString(),
      });
    }
  }

  const pendingProducts = Array.from(pendingProductsMap.values());
  const recentReviews = myReviews.map((review) => ({
    id: review.id,
    productName: review.product.name,
    rating: review.rating,
    comment: review.comment,
    createdAt: review.createdAt.toISOString(),
  }));

  return (
    <ReviewsRatingsContent
      pendingProducts={pendingProducts}
      recentReviews={recentReviews}
    />
  );
}
