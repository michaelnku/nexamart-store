import Image from "next/image";
import { prisma } from "@/lib/prisma";
import StarRating from "./StarRating";

interface ReviewListProps {
  productId: string;
}

export default async function ReviewList({ productId }: ReviewListProps) {
  const reviews = await prisma.review.findMany({
    where: { productId },
    include: {
      user: {
        select: {
          name: true,
          image: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  if (!reviews.length) {
    return <p className="text-gray-500">No reviews yet.</p>;
  }

  return (
    <div className="space-y-6">
      {reviews.map((review) => (
        <div key={review.id} className="border-b pb-4 last:border-b-0">
          <div className="flex items-center gap-3 mb-2">
            <div className="relative w-8 h-8 rounded-full overflow-hidden bg-gray-100 shrink-0">
              <Image
                src={review.user.image || "/avatar.png"}
                alt={review.user.name || "Reviewer"}
                fill
                sizes="32px"
                className="object-cover"
              />
            </div>

            <span className="font-medium">{review.user.name || "Anonymous"}</span>
            <span className="text-xs text-green-600 font-medium">
              Verified Purchase
            </span>
          </div>

          <StarRating value={review.rating} readonly size="sm" />

          {review.comment && (
            <p className="text-sm text-gray-700 mt-2">{review.comment}</p>
          )}

          <p className="text-xs text-gray-400 mt-1">
            {new Date(review.createdAt).toLocaleDateString()}
          </p>
        </div>
      ))}
    </div>
  );
}
