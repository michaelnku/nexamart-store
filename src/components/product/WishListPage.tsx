"use client";

import Image from "next/image";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Trash2 } from "lucide-react";
import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { FullProduct } from "@/lib/types";
import {
  moveAllWishlistToCartAction,
  toggleWishlistAction,
} from "@/actions/auth/wishlist";
import WishlistCardSkeleton from "../skeletons/WishlistCardSkeleton";
import { Separator } from "../ui/separator";
import AddToCartControl from "./AddtoCartButton";
import { useWishlistStore } from "@/stores/useWishlistStore";
import { useFormatMoneyFromUSD } from "@/hooks/useFormatMoneyFromUSD";

interface Props {
  initialData: FullProduct[];
}

const WishListPage = ({ initialData }: Props) => {
  const [, startTransition] = useTransition();
  const [hydrated, setHydrated] = useState(false);

  const router = useRouter();

  const { items, remove, sync, clear } = useWishlistStore();

  const formatMoneyFromUSD = useFormatMoneyFromUSD();

  useEffect(() => {
    sync(initialData.map((p) => ({ productId: p.id })));
    const id = requestAnimationFrame(() => setHydrated(true));
    return () => cancelAnimationFrame(id);
  }, [initialData, sync]);

  const wishlistProducts = initialData.filter((p) =>
    items.some((i) => i.productId === p.id),
  );

  const removeItem = (productId: string) => {
    startTransition(async () => {
      remove(productId);

      const res = await toggleWishlistAction(productId);

      if (!res || res.error) {
        sync(initialData.map((p) => ({ productId: p.id })));
        toast.error("Something went wrong");
        return;
      }

      toast.success("Removed from wishlist ❤️");
    });
  };

  const moveAllToCart = () => {
    startTransition(async () => {
      const res = await moveAllWishlistToCartAction();

      if (!res || res.error) {
        toast.error(res?.error ?? "Failed to move items to cart");
        return;
      }

      const movedCount =
        typeof res.movedCount === "number" ? res.movedCount : 0;

      clear();
      toast.success(
        movedCount > 0
          ? `${movedCount} item${movedCount > 1 ? "s" : ""} moved to cart`
          : "Wishlist is empty",
      );
      router.push("/cart");
      router.refresh();
    });
  };

  if (!hydrated) {
    return (
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-5 pt-6">
        {Array.from({ length: 8 }).map((_, i) => (
          <WishlistCardSkeleton key={i} />
        ))}
      </div>
    );
  }

  return (
    <main className="min-h-screen max-w-7xl mx-auto px-3 sm:px-6 py-6 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight">
            Wishlist{" "}
            {wishlistProducts.length > 0 && `(${wishlistProducts.length})`}
          </h1>
          <p className="text-sm text-gray-500">
            Save items you love — we’ll notify you when deals drop.
          </p>
        </div>

        {wishlistProducts.length > 0 && (
          <div className="flex items-center gap-2">
            <Button
              onClick={moveAllToCart}
              className="bg-[#3c9ee0] hover:bg-[#318bc4] text-white font-medium rounded-lg"
            >
              Move All To Cart
            </Button>
            <Button
              onClick={() => router.push("/")}
              variant="outline"
              className="font-medium rounded-lg"
            >
              Browse More
            </Button>
          </div>
        )}
      </div>

      <Separator />

      {wishlistProducts.length === 0 ? (
        <div className="text-center py-24 space-y-4">
          <p className="text-lg text-gray-500">Your wishlist is empty 💔</p>
          <Button
            size="lg"
            onClick={() => router.push("/")}
            className="bg-[#3c9ee0] hover:bg-[#318bc4] text-white rounded-lg px-8"
          >
            Explore Products
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6 pt-6">
          {wishlistProducts.map((product) => {
            const discount = product.discount ?? 0;
            const oldPrice =
              discount > 0 ? product.basePriceUSD / (1 - discount / 100) : null;
            const cheapestVariant =
              product.variants && product.variants.length > 0
                ? [...product.variants].sort(
                    (a, b) => a.priceUSD - b.priceUSD,
                  )[0]
                : null;

            return (
              <Card
                key={product.id}
                className="border rounded-xl bg-white shadow-sm hover:shadow-md transition-all p-3 flex flex-col group cursor-pointer"
              >
                <div
                  className="relative w-full aspect-square rounded-lg overflow-hidden bg-gray-50"
                  onClick={() => router.push(`/product/${product.id}`)}
                >
                  <Image
                    src={product.images?.[0]?.imageUrl ?? "/placeholder.png"}
                    alt={product.name}
                    fill
                    className="object-cover duration-300 group-hover:scale-105"
                  />
                  {discount > 0 && (
                    <span className="absolute top-2 right-2 bg-[#3c9ee0] text-white px-2 py-[2px] rounded-md text-xs font-semibold shadow">
                      -{discount}%
                    </span>
                  )}
                </div>

                <div className="flex flex-col gap-1 flex-1 mt-2">
                  <p
                    className="font-medium text-sm line-clamp-2 leading-tight group-hover:text-[#3c9ee0]"
                    onClick={() => router.push(`/product/${product.id}`)}
                  >
                    {product.name}
                  </p>

                  <div className="flex items-center gap-2">
                    <p className="font-bold text-[17px] text-black">
                      {formatMoneyFromUSD(product.basePriceUSD)}
                    </p>

                    {oldPrice && (
                      <p className="line-through text-[12px] text-gray-400">
                        {formatMoneyFromUSD(oldPrice)}
                      </p>
                    )}
                  </div>

                  <p className="text-[11px] text-gray-500">
                    Sold by{" "}
                    <span
                      onClick={() =>
                        router.push(`/store/${product.store.slug}`)
                      }
                      className="text-black hover:text-[#3c9ee0] hover:underline font-medium"
                    >
                      {product.store.name}
                    </span>
                  </p>

                  <button
                    className="text-[#3c9ee0] hover:text-[#318bc4] hover:underline text-[12.5px] flex items-center gap-1 w-fit mt-1"
                    onClick={() => removeItem(product.id)}
                  >
                    <Trash2 size={14} /> Remove
                  </button>
                </div>

                <div className="mt-auto pt-3">
                  <AddToCartControl
                    productId={product.id}
                    variantId={cheapestVariant?.id ?? null}
                  />
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </main>
  );
};

export default WishListPage;
