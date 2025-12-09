"use client";
import { Heart } from "lucide-react";
import { useTransition } from "react";
import { toast } from "sonner";
import { toggleWishlistAction } from "@/actions/auth/wishlist";
import { useWishlistStore } from "@/stores/useWishlistStore";

export default function WishlistButton({
  productId,
  isWishlisted,
  userId,
}: {
  productId: string;
  isWishlisted: boolean;
  userId?: string | null;
}) {
  const [isPending, startTransition] = useTransition();
  const wishlistItems = useWishlistStore((s) => s.items);
  const toggle = useWishlistStore((s) => s.toggle);

  const toggleLike = () => {
    toggle(productId);

    startTransition(async () => {
      const res = await toggleWishlistAction(productId);

      if (res?.error) {
        toggle(productId);
        toast.error(res.error);
      } else {
        toast.success(
          res.wishlisted ? "Added to wishlist ❤️" : "Removed from wishlist"
        );
      }
    });
  };

  const liked =
    wishlistItems.some((i) => i.productId === productId) || isWishlisted;

  return (
    <button
      onClick={toggleLike}
      disabled={isPending}
      className="p-2 rounded-full"
    >
      <Heart
        className={`w-6 h-6 transition duration-200 ${
          liked ? "fill-red-500 stroke-red-500" : "stroke-gray-500"
        }`}
      />
    </button>
  );
}
