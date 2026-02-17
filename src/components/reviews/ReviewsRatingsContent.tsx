import Image from "next/image";
import ReviewForm from "@/components/reviews/ReviewForm";
import StarRating from "@/components/reviews/StarRating";

type PendingReviewItem = {
  productId: string;
  productName: string;
  imageUrl: string;
  orderId: string;
  orderedAt: string;
};

type RecentReviewItem = {
  id: string;
  productName: string;
  rating: number;
  comment: string | null;
  createdAt: string;
};

type ReviewsRatingsContentProps = {
  pendingProducts: PendingReviewItem[];
  recentReviews: RecentReviewItem[];
};

export default function ReviewsRatingsContent({
  pendingProducts,
  recentReviews,
}: ReviewsRatingsContentProps) {
  return (
    <main className="max-w-5xl mx-auto px-4 py-8 space-y-10">
      <section className="space-y-2">
        <h1 className="text-2xl font-bold">Reviews and Ratings</h1>
        <p className="text-sm text-gray-600">
          Review products from completed deliveries to help other buyers.
        </p>
      </section>

      <section className="space-y-4">
        <h2 className="text-xl font-semibold">Pending Reviews</h2>

        {pendingProducts.length === 0 ? (
          <p className="text-gray-500">You have no pending reviews right now.</p>
        ) : (
          <div className="space-y-6">
            {pendingProducts.map((item) => (
              <article
                key={item.productId}
                className="border rounded-xl p-4 bg-white space-y-4"
              >
                <div className="flex items-center gap-4">
                  <div className="relative w-16 h-16 rounded-md overflow-hidden bg-gray-100 shrink-0">
                    <Image
                      src={item.imageUrl}
                      alt={item.productName}
                      fill
                      className="object-cover"
                      sizes="64px"
                    />
                  </div>

                  <div className="min-w-0">
                    <p className="font-medium line-clamp-2">{item.productName}</p>
                    <p className="text-xs text-gray-500">
                      Order #{item.orderId.slice(0, 12)}... - {new Date(item.orderedAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>

                <ReviewForm productId={item.productId} />
              </article>
            ))}
          </div>
        )}
      </section>

      <section className="space-y-4">
        <h2 className="text-xl font-semibold">Your Recent Reviews</h2>

        {recentReviews.length === 0 ? (
          <p className="text-gray-500">You have not submitted any reviews yet.</p>
        ) : (
          <div className="space-y-4">
            {recentReviews.slice(0, 10).map((review) => (
              <article key={review.id} className="border rounded-xl p-4 bg-white">
                <div className="flex items-center justify-between gap-3 mb-2">
                  <p className="font-medium line-clamp-1">{review.productName}</p>
                  <StarRating value={review.rating} readonly size="sm" />
                </div>

                {review.comment ? (
                  <p className="text-sm text-gray-700">{review.comment}</p>
                ) : (
                  <p className="text-sm text-gray-400 italic">No comment</p>
                )}

                <p className="text-xs text-gray-400 mt-2">
                  Reviewed on {new Date(review.createdAt).toLocaleDateString()}
                </p>
              </article>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
