"use client";

import Image from "next/image";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { ArrowRight, ClipboardList, Edit, Trash } from "lucide-react";
import { FullProduct } from "@/lib/types";
import { deleteProductAction } from "@/actions/auth/product";
import { useRouter } from "next/navigation";
import { useMemo, useState, useTransition } from "react";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { toast } from "sonner";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselPrevious,
  CarouselNext,
} from "../ui/carousel";
import { useFormatMoneyFromUSD } from "@/hooks/useFormatMoneyFromUSD";
import ProductInformationSections from "./ProductInformationSections";
import { normalizeFoodDetails } from "@/app/marketplace/_components/productFormHelpers";
import { MarketplaceImagePreview } from "@/components/media/MarketplaceImagePreview";

type ProductDetailProps = { data: FullProduct };

export default function SellerProductDetail({ data }: ProductDetailProps) {
  const formatMoneyFromUSD = useFormatMoneyFromUSD();
  const router = useRouter();
  const user = useCurrentUser();

  const isOwner = user?.role === "SELLER" && data.store?.userId === user.id;

  const [activeIndex, setActiveIndex] = useState(0);
  const [isDeleting, setIsDeleting] = useState(false);
  const [, startTransition] = useTransition();

  const images = data.images ?? [];
  const mainImage = images[activeIndex]?.imageUrl || "/placeholder.png";

  const previewImages = useMemo(
    () =>
      images.map((img, index) => ({
        id: `${data.id}-${index}`,
        src: img.imageUrl,
        alt: `${data.name} image ${index + 1}`,
      })),
    [images, data.id, data.name],
  );

  const totalStock = useMemo(
    () => data.variants?.reduce((sum, v) => sum + v.stock, 0) || 0,
    [data.variants],
  );

  const inStock = totalStock > 0;

  const savingsPercent = useMemo(() => {
    const discounts = data.variants?.map((v) => v.discount ?? 0) ?? [];
    const maxDiscount = discounts.length ? Math.max(...discounts) : 0;
    return maxDiscount > 0 ? `${maxDiscount}% OFF` : null;
  }, [data.variants]);

  const handleDeleteProduct = () => {
    if (isDeleting) return;
    setIsDeleting(true);
    startTransition(async () => {
      const res = await deleteProductAction(data.id);
      if (!res?.error) {
        toast.success("Product deleted");
        router.push("/marketplace/dashboard/seller/products");
      }
      setIsDeleting(false);
    });
  };

  const basePriceUSD =
    data.variants.length > 0
      ? Math.min(...data.variants.map((v) => v.priceUSD))
      : data.basePriceUSD;

  const priceDisplay = formatMoneyFromUSD(basePriceUSD);
  const isFoodProduct = Boolean(
    data.isFoodProduct || data.store?.type === "FOOD",
  );
  const foodDetails = normalizeFoodDetails(data.foodDetails);
  const updateHref = `/marketplace/dashboard/seller/products/${data.id}/update`;
  const emptyDetailsState = isOwner ? (
    <div className="rounded-[24px] border border-dashed border-sky-200 bg-[linear-gradient(145deg,#f8fbff_0%,#eef6ff_55%,#ffffff_100%)] p-8 text-center shadow-sm dark:border-sky-900/40 dark:bg-[linear-gradient(145deg,rgba(15,23,42,0.94)_0%,rgba(10,20,40,0.96)_55%,rgba(2,6,23,0.98)_100%)]">
      <div className="mx-auto flex max-w-lg flex-col items-center gap-4">
        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-[#3c9ee0]/10 text-[#3c9ee0] dark:bg-sky-500/15 dark:text-sky-300">
          <ClipboardList className="h-6 w-6" />
        </div>
        <div className="space-y-2">
          <h3 className="text-lg font-semibold text-slate-950 dark:text-white">
            Add more product details
          </h3>
          <p className="text-sm leading-6 text-slate-600 dark:text-zinc-300">
            This listing is missing the supporting details buyers expect. Add richer information to improve trust and conversion.
          </p>
        </div>
        <Button
          asChild
          className="rounded-xl bg-[#3c9ee0] px-5 text-white hover:bg-[#318bc4]"
        >
          <Link href={updateHref}>
            Update Product Details
            <ArrowRight className="ml-2 h-4 w-4" />
          </Link>
        </Button>
      </div>
    </div>
  ) : undefined;

  return (
    <main className="mx-auto max-w-7xl space-y-10 px-3 py-8 sm:px-6">
      <section className="grid grid-cols-1 gap-10 rounded-xl border bg-white p-5 shadow dark:bg-neutral-900 lg:grid-cols-2">
        <div className="space-y-4">
          <MarketplaceImagePreview
            images={previewImages}
            initialIndex={activeIndex}
            variant="product"
            title={data.name}
            description="Preview product images"
            triggerClassName="rounded-xl"
          >
            <div className="relative aspect-square overflow-hidden rounded-xl border bg-white cursor-pointer">
              <Image
                src={mainImage}
                alt={data.name}
                fill
                className="object-contain transition hover:scale-[1.02]"
              />
            </div>
          </MarketplaceImagePreview>

          <div className="relative">
            <Carousel className="w-full">
              <CarouselContent className="flex gap-2 px-10">
                {images.map((img, i) => (
                  <CarouselItem key={i} className="basis-1/6 min-w-[72px]">
                    <button
                      onClick={() => setActiveIndex(i)}
                      className={`relative aspect-square w-full overflow-hidden rounded-lg border transition ${
                        activeIndex === i
                          ? "border-[#3c9ee0] ring-2 ring-[#3c9ee0]"
                          : "border-gray-300 hover:border-gray-500"
                      }`}
                    >
                      <Image
                        fill
                        src={img.imageUrl}
                        alt={`${data.name} thumbnail ${i + 1}`}
                        className="object-cover"
                      />
                    </button>
                  </CarouselItem>
                ))}
              </CarouselContent>

              <CarouselPrevious className="absolute left-1 top-1/2 z-20 size-8 -translate-y-1/2 rounded-full border bg-white text-gray-700 shadow hover:bg-gray-100" />
              <CarouselNext className="absolute right-1 top-1/2 z-20 size-8 -translate-y-1/2 rounded-full border bg-white text-gray-700 shadow hover:bg-gray-100" />
            </Carousel>
          </div>
        </div>

        <div className="flex flex-col space-y-6">
          <h1 className="text-2xl font-semibold leading-snug sm:text-3xl">
            {data.name}
          </h1>

          {data.brand && (
            <p className="text-sm text-gray-600">
              Brand: <span className="font-medium">{data.brand}</span>
            </p>
          )}

          <div className="space-y-2 rounded-xl border bg-[#f8fafc] p-5 shadow">
            <p className="text-3xl font-bold text-[#111] sm:text-4xl">
              {priceDisplay}
            </p>
            {savingsPercent && (
              <span className="inline-block rounded bg-yellow-300 px-2 py-1 text-xs font-bold text-yellow-900 shadow">
                Save {savingsPercent}
              </span>
            )}
            <p
              className={`text-sm font-medium ${
                inStock ? "text-green-700" : "text-red-600"
              }`}
            >
              {inStock ? `In Stock — ${totalStock} available` : "Out of Stock"}
            </p>
          </div>

          {data.variants.length > 0 && (
            <div className="space-y-3 rounded-xl border bg-white p-5 shadow dark:bg-neutral-800">
              <h3 className="text-lg font-semibold">
                {isFoodProduct ? "Pricing and Availability" : "Variants"}
              </h3>
              <div className="space-y-2">
                {data.variants.map((v, i) => (
                  <div
                    key={i}
                    className="flex flex-wrap items-center justify-between border-b py-2 text-sm last:border-none"
                  >
                    <span>
                      {isFoodProduct ? (
                        <span className="font-medium">Standard serving</span>
                      ) : (
                        <>
                          <span className="font-medium">{v.color}</span>
                          <span className="pl-4 font-medium">{v.size}</span>
                        </>
                      )}
                    </span>
                    <span className="text-gray-500">
                      {formatMoneyFromUSD(v.priceUSD)}
                    </span>
                    <span className="text-gray-500">Stock: {v.stock}</span>
                    <span className="text-xs text-gray-400">SKU: {v.sku}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="flex gap-12">
            <div className="flex-1">
              {isOwner && (
                <Button
                  onClick={() => {
                    router.push(
                      `/marketplace/dashboard/seller/products/${data.id}/update`,
                    );
                  }}
                  className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#3c9ee0] py-4 text-lg shadow hover:bg-[#318bc4]"
                >
                  <Edit className="h-5 w-5" /> Edit Product
                </Button>
              )}
            </div>

            <div>
              {isOwner && (
                <Button
                  variant="destructive"
                  size="icon"
                  onClick={handleDeleteProduct}
                  disabled={isDeleting}
                  className="shrink-0 rounded-full shadow"
                >
                  <Trash className="h-5 w-5" />
                </Button>
              )}
            </div>
          </div>
        </div>
      </section>

      <ProductInformationSections
        data={data}
        isFoodProduct={isFoodProduct}
        foodDetails={foodDetails}
        foodEmptyState={emptyDetailsState}
        generalEmptyState={emptyDetailsState}
      />
    </main>
  );
}
