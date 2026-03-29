"use client";

import Image from "next/image";
import Link from "next/link";
import WishlistButton from "./WishlistButton";
import AddToCartControl from "./AddtoCartButton";
import { ProductCardType } from "@/lib/types";
import { useMemo } from "react";
import { useFormatMoneyFromUSD } from "@/hooks/useFormatMoneyFromUSD";
import StarRating from "@/components/reviews/StarRating";
import { getProductAvailabilityState } from "@/lib/product/availability";

type Props = {
  product: ProductCardType;
  userId?: string | null;
  isWishlisted?: boolean;
};

export default function PublicProductCard({
  product,
  userId,
  isWishlisted,
}: Props) {
  const formatMoneyFromUSD = useFormatMoneyFromUSD();

  const preferredVariant = useMemo(() => {
    if (!product.variants?.length) return null;
    const sortedVariants = [...product.variants].sort(
      (a, b) => a.priceUSD - b.priceUSD,
    );
    return sortedVariants.find((variant) => variant.stock > 0) ?? sortedVariants[0];
  }, [product.variants]);

  const availabilityState = useMemo(
    () =>
      getProductAvailabilityState({
        product: {
          isFoodProduct: product.isFoodProduct,
          foodProductConfig: product.foodProductConfig ?? null,
          store: {
            timeZone: product.store.timeZone ?? null,
            location: product.store.location ?? null,
            address: product.store.address ?? null,
          },
        },
        variant: preferredVariant,
      }),
    [preferredVariant, product],
  );

  const displayPriceUSD = useMemo(() => {
    return preferredVariant ? preferredVariant.priceUSD : product.basePriceUSD;
  }, [preferredVariant, product.basePriceUSD]);

  const displayOldPriceUSD = useMemo(() => {
    if (!preferredVariant) return null;
    if (!preferredVariant.discount || !(preferredVariant.oldPriceUSD ?? 0))
      return null;
    return preferredVariant.oldPriceUSD;
  }, [preferredVariant]);

  const discount = useMemo(() => {
    if (!preferredVariant) return null;
    return preferredVariant.discount && preferredVariant.discount > 0
      ? preferredVariant.discount
      : null;
  }, [preferredVariant]);

  return (
    <div className="relative border rounded-xl bg-white dark:bg-neutral-900 shadow-sm hover:shadow-lg transition duration-300 group overflow-hidden">
      {discount && (
        <span
          className="
                absolute top-4 left-2 bg-[var(--brand-blue)] text-white text-xs
                font-semibold px-2 py-1 rounded-md shadow-sm z-10
              "
        >
          -{discount}%
        </span>
      )}

      <div className="absolute top-2 right-2 z-20">
        <WishlistButton
          productId={product.id}
          userId={userId}
          isWishlisted={Boolean(isWishlisted)}
        />
      </div>

      <Link href={`/products/${product.id}`}>
        <div className="relative aspect-[4/5] bg-gray-100 rounded-t-xl overflow-hidden">
          <Image
            src={product.images?.[0]?.imageUrl ?? "/placeholder.png"}
            alt={product.name || "Product Image"}
            fill
            className="object-cover group-hover:scale-105 transition-transform duration-500"
          />
        </div>
      </Link>

      <div className="px-3 py-3 space-y-2">
        <Link href={`/products/${product.id}`}>
          <p className="text-sm font-medium text-gray-800 dark:text-gray-500 line-clamp-1 leading-tight hover:text-blue-600 transition">
            {product.name}
          </p>
        </Link>

        <div className="flex items-center gap-2">
          <StarRating value={product.averageRating} readonly size="sm" />
          <span className="text-sm text-gray-500">({product.reviewCount})</span>
        </div>

        <div className="flex items-baseline gap-2">
          <p className="font-semibold text-gray-900 dark:text-gray-500 text-sm">
            {formatMoneyFromUSD(displayPriceUSD)}
          </p>

          {discount && displayOldPriceUSD && (
            <p className="line-through text-gray-400 dark:text-gray-500 text-xs">
              {formatMoneyFromUSD(displayOldPriceUSD)}
            </p>
          )}
        </div>

        <AddToCartControl
          productId={product.id}
          variantId={preferredVariant?.id ?? null}
          availableStock={availabilityState.availableStock}
          isOrderable={availabilityState.isOrderable}
        />
      </div>
    </div>
  );
}
