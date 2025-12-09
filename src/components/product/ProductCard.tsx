"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import Image from "next/image";
import { useMemo } from "react";
import { Edit, ShoppingCart } from "lucide-react";
import { FullProduct } from "@/lib/types";
import { useCurrentUserQuery } from "@/stores/getCurrentUser";
import { formatCurrency } from "@/utils/formatCurrency";
import { useCurrency } from "@/hooks/useCurrency";
import { convertPrice } from "@/utils/convertPrice";

type ProductCardProps = {
  productData: FullProduct;
};

const ProductCard = ({ productData }: ProductCardProps) => {
  const { data: user } = useCurrentUserQuery();

  //   const { currency, rates } = useCurrency();
  // const converted = convertPrice(productData.basePrice, productData.currency ?? "USD", currency, rates);

  if (!productData) {
    return (
      <div className="p-4 border rounded-xl bg-white">
        <p className="text-sm text-gray-500">Product unavailable</p>
      </div>
    );
  }

  const imageUrl = productData.images?.[0]?.imageUrl || "/placeholder.png";

  const totalStock = useMemo(() => {
    const variantStock =
      productData.variants?.reduce((sum, v) => sum + (v.stock ?? 0), 0) ?? 0;

    if (variantStock === 0 && typeof productData.nonVariantStock === "number") {
      return productData.nonVariantStock;
    }

    return variantStock;
  }, [productData.variants, productData.nonVariantStock]);

  const inStock = totalStock > 0;

  const cheapestVariant = useMemo(() => {
    if (!productData.variants?.length) return null;
    return [...productData.variants].sort((a, b) => a.price - b.price)[0];
  }, [productData.variants]);

  const displayPrice = useMemo(() => {
    if (!cheapestVariant) return productData.basePrice;
    return cheapestVariant.price;
  }, [cheapestVariant, productData.basePrice]);

  const displayOldPrice = useMemo(() => {
    if (!cheapestVariant) return null;
    if (!cheapestVariant.discount || !(cheapestVariant.oldPrice ?? 0))
      return null;
    return cheapestVariant.oldPrice;
  }, [cheapestVariant]);

  const displayDiscount = useMemo(() => {
    if (!cheapestVariant) return null;
    return cheapestVariant.discount && cheapestVariant.discount > 0
      ? cheapestVariant.discount
      : null;
  }, [cheapestVariant]);

  return (
    <div
      className="
        bg-white dark:bg-zinc-900 border rounded-xl overflow-hidden shadow-sm
        hover:shadow-[0_4px_16px_rgba(60,158,224,0.25)] transition-all cursor-pointer group
        flex flex-col justify-between
      "
    >
      <Link href={`/market-place/dashboard/seller/products/${productData.id}`}>
        <div className="relative bg-white aspect-square p-3">
          {displayDiscount && (
            <span
              className="
                absolute top-3 right-3 bg-[var(--brand-blue)] text-white text-xs
                font-semibold px-2 py-1 rounded-md shadow-sm z-10
              "
            >
              -{displayDiscount}%
            </span>
          )}

          <Image
            src={imageUrl}
            alt={productData.name}
            fill
            className="object-contain group-hover:scale-[1.03] duration-300"
          />
        </div>
      </Link>

      {/* Content */}
      <div className="px-4 pb-4 flex flex-col gap-2">
        {/* Product Name */}
        <Link
          href={`/market-place/dashboard/seller/products/${productData.id}`}
        >
          <h3 className="font-semibold text-[15px] mt-2 line-clamp-2 transition text-black dark:text-white group-hover:text-[var(--brand-blue)]">
            {productData.name}
          </h3>
        </Link>

        {/* Stock */}
        <p className="text-xs text-gray-500">
          {inStock ? `${totalStock} in stock` : "Out of stock"}
        </p>

        {/* Price */}
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-3">
            <p className="text-xl font-bold text-[var(--brand-black)] dark:text-white">
              {formatCurrency(displayPrice, productData.currency ?? "USD")}
            </p>

            {displayOldPrice && (
              <span className="line-through text-sm text-gray-400">
                {formatCurrency(displayOldPrice, productData.currency ?? "USD")}
              </span>
            )}
          </div>

          <small className="text-[11px] text-gray-500">
            {productData.shippingFee && productData.shippingFee > 0
              ? `+ ${formatCurrency(
                  productData.shippingFee,
                  productData.currency ?? "USD"
                )} shipping`
              : "FREE Shipping"}
          </small>

          {inStock && totalStock < 5 && (
            <span className="text-[12px] font-medium text-red-600">
              🔥 Only {totalStock} left — selling fast
            </span>
          )}
        </div>

        {user?.role === "SELLER" ? (
          <Link
            href={`/market-place/dashboard/seller/products/${productData.id}/update`}
          >
            <Button
              className="
                w-full flex items-center justify-center gap-2 text-sm py-3 rounded-lg
                bg-[var(--brand-blue)] hover:bg-[var(--brand-blue-hover)] text-white shadow-md
              "
            >
              <Edit className="w-4 h-4" />
              Edit Product
            </Button>
          </Link>
        ) : (
          <Button
            disabled={!inStock}
            className="
              w-full text-sm py-3 rounded-lg flex items-center justify-center gap-2 shadow-md
              bg-[var(--brand-blue)] hover:bg-[var(--brand-blue-hover)] text-white
              disabled:bg-gray-300 disabled:text-gray-600 disabled:cursor-not-allowed
            "
          >
            {inStock ? (
              <>
                <ShoppingCart className="w-4 h-4" /> Add to Cart
              </>
            ) : (
              "Out of Stock"
            )}
          </Button>
        )}
      </div>
    </div>
  );
};

export default ProductCard;
