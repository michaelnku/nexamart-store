"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import StarRating from "./StarRating";
import { toast } from "sonner";
import { createReviewAction } from "@/actions/reviews/createReviewActions";

interface ReviewFormProps {
  productId: string;
}

export default function ReviewForm({ productId }: ReviewFormProps) {
  const router = useRouter();
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [isPending, startTransition] = useTransition();

  const handleSubmit = () => {
    startTransition(async () => {
      try {
        await createReviewAction({
          productId,
          rating,
          comment: comment.trim() || undefined,
        });
        toast.success("Review submitted successfully");
        setComment("");
        setRating(5);
        router.refresh();
      } catch (err: any) {
        toast.error(err?.message || "Failed to submit review");
      }
    });
  };

  return (
    <div className="border rounded-xl p-6 space-y-4 bg-white shadow-sm">
      <h3 className="text-lg font-semibold">Write a Review</h3>

      <StarRating value={rating} onChange={setRating} />

      <textarea
        className="w-full border rounded-lg p-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        rows={4}
        placeholder="Share your experience with this product..."
        value={comment}
        onChange={(e) => setComment(e.target.value)}
      />

      <button
        onClick={handleSubmit}
        disabled={isPending}
        className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition disabled:opacity-60"
      >
        {isPending ? "Submitting..." : "Submit Review"}
      </button>
    </div>
  );
}
