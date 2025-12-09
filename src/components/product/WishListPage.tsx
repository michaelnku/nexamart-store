"use client";

import Image from "next/image";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Trash2 } from "lucide-react";
import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { FullProduct } from "@/lib/types";
import { toggleWishlistAction } from "@/actions/auth/wishlist";
import WishlistCardSkeleton from "../skeletons/WishlistCardSkeleton";
import { useQuery } from "@tanstack/react-query";
import { Separator } from "../ui/separator";
import AddToCartControl from "./AddtoCartButton";

interface Props {
  initialData: FullProduct[];
}

const currencySymbol = (currency: string | null | undefined) => {
  const map: Record<string, string> = {
    NGN: "₦",
    USD: "$",
    EUR: "€",
    GBP: "£",
  };
  return map[currency ?? "USD"] ?? currency ?? "";
};

const WishListPage = ({ initialData }: Props) => {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  const { data, isPending, refetch } = useQuery({
    queryKey: ["wishlist"],
    queryFn: () => initialData,
    initialData,
    staleTime: 1000 * 60 * 5,
  });

  if (!data) return "No Products found";

  const removeItem = (productId: string) => {
    startTransition(async () => {
      const res = await toggleWishlistAction(productId);
      if (!res || res.error) {
        toast.error("Something went wrong");
        return;
      }

      toast.success("Removed from wishlist ❤️");
      await refetch();
    });
  };

  return (
    <main className="min-h-screen max-w-7xl mx-auto px-3 sm:px-6 py-6 space-y-6">
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight">
            Wishlist <span className="text-[#3c9ee0]">({data.length})</span>
          </h1>
          <p className="text-sm text-gray-500">
            Save items you love — we’ll notify you when deals drop.
          </p>
        </div>

        {data.length > 0 && (
          <Button
            onClick={() => router.push("/")}
            className="bg-[#3c9ee0] hover:bg-[#318bc4] text-white font-medium rounded-lg"
          >
            Browse More
          </Button>
        )}
      </div>

      <Separator />

      {/* EMPTY WISHLIST */}
      {data.length === 0 ? (
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
        <>
          {/* LOADING STATE */}
          {isPending ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-5 pt-4">
              {Array.from({ length: 8 }).map((_, i) => (
                <WishlistCardSkeleton key={i} />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6 pt-6">
              {data.map((product) => {
                const discount = product.discount ?? 0;
                const oldPrice =
                  discount > 0
                    ? product.basePrice / (1 - discount / 100)
                    : null;

                const symbol = currencySymbol(product.currency);

                return (
                  <Card
                    key={product.id}
                    className="border rounded-xl bg-white shadow-sm hover:shadow-md transition-all p-3 flex flex-col group cursor-pointer"
                  >
                    {/* PRODUCT IMAGE */}
                    <div
                      className="relative w-full aspect-square rounded-lg overflow-hidden bg-gray-50"
                      onClick={() => router.push(`/product/${product.id}`)}
                    >
                      <Image
                        src={
                          product.images?.[0]?.imageUrl ?? "/placeholder.png"
                        }
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

                    {/* TEXT INFO */}
                    <div className="flex flex-col gap-1 flex-1 mt-2">
                      <p
                        className="font-medium text-sm line-clamp-2 leading-tight group-hover:text-[#3c9ee0]"
                        onClick={() => router.push(`/product/${product.id}`)}
                      >
                        {product.name}
                      </p>

                      <div className="flex items-center gap-2">
                        <p className="font-bold text-[17px] text-black">
                          {symbol}
                          {product.basePrice.toLocaleString()}
                        </p>
                        {oldPrice && (
                          <p className="line-through text-[12px] text-gray-400">
                            {symbol}
                            {oldPrice.toLocaleString(undefined, {
                              maximumFractionDigits: 0,
                            })}
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

                      {/* REMOVE */}
                      <button
                        className="text-[#3c9ee0] hover:text-[#318bc4] hover:underline text-[12.5px] flex items-center gap-1 w-fit mt-1"
                        onClick={() => removeItem(product.id)}
                      >
                        <Trash2 size={14} /> Remove
                      </button>
                    </div>

                    {/* ADD TO CART */}
                    <div className="mt-auto pt-3">
                      <AddToCartControl
                        productId={product.id}
                        variantId={null}
                      />
                    </div>
                  </Card>
                );
              })}
            </div>
          )}
        </>
      )}
    </main>
  );
};

export default WishListPage;
