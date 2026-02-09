"use client";

import Image from "next/image";
import { X, Star, ShieldCheck, Truck } from "lucide-react";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogOverlay,
  DialogPortal,
  DialogTitle,
} from "@/components/ui/dialog";
import { FullProduct } from "@/lib/types";
import { useState, useEffect, useRef } from "react";
import WishlistButton from "./WishlistButton";
import AddToCartControl from "./AddtoCartButton";
import Link from "next/link";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselPrevious,
  CarouselNext,
} from "../ui/carousel";
import { Separator } from "../ui/separator";
import { useCartStore } from "@/stores/useCartstore";
import { useWishlistStore } from "@/stores/useWishlistStore";
import { useFormatMoneyFromUSD } from "@/hooks/useFormatMoneyFromUSD";
import { addRecentlyViewed } from "@/hooks/useRecentlyViewed";

type ProductVariant = FullProduct["variants"][number];

type Props = {
  data: FullProduct;
  defaultVariant: ProductVariant;
  cartItems: {
    productId: string;
    variantId: string | null;
    quantity: number;
  }[];
  isWishlisted: boolean;
  userId?: string | null;
};

export default function ProductPublicDetail({
  data,
  defaultVariant,
  cartItems,
  isWishlisted,
  userId,
}: Props) {
  const formatMoneyFromUSD = useFormatMoneyFromUSD();

  const [activeIndex, setActiveIndex] = useState(0);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isImageFading, setIsImageFading] = useState(false);
  const fadeRafRef = useRef<number | null>(null);

  useEffect(() => {
    addRecentlyViewed(data.id);
  }, [data.id]);

  useEffect(() => {
    if (cartItems?.length) useCartStore.getState().sync(cartItems);
  }, [cartItems]);

  useEffect(() => {
    if (isWishlisted) useWishlistStore.getState().add(data.id);
  }, [isWishlisted, data.id]);

  const images = data.images ?? [];
  const mainImage = images[activeIndex]?.imageUrl || "/placeholder.png";

  const colors = [
    ...new Set(data.variants.map((v) => v.color).filter(Boolean)),
  ];
  const sizes = [...new Set(data.variants.map((v) => v.size).filter(Boolean))];

  const [selectedColor, setSelectedColor] = useState<string | null>(null);
  const [selectedSize, setSelectedSize] = useState<string | null>(null);
  const [selectedVariant, setSelectedVariant] = useState(defaultVariant);

  /* Pricing logic */
  const priceUSD = selectedVariant.priceUSD;
  const oldPriceUSD = selectedVariant.oldPriceUSD ?? null;

  const discount =
    oldPriceUSD && oldPriceUSD > priceUSD
      ? Math.round(((oldPriceUSD - priceUSD) / oldPriceUSD) * 100)
      : null;

  const totalStock = selectedVariant.stock;
  const inStock = totalStock > 0;

  useEffect(() => {
    setSelectedColor(defaultVariant.color ?? null);
    setSelectedSize(defaultVariant.size ?? null);
  }, [defaultVariant]);

  useEffect(() => {
    const match = data.variants.find(
      (v) =>
        (selectedColor ? v.color === selectedColor : true) &&
        (selectedSize ? v.size === selectedSize : true),
    );

    if (match) {
      setSelectedVariant(match);
    }
  }, [selectedColor, selectedSize, data.variants]);

  useEffect(() => {
    setIsImageFading(true);
    if (fadeRafRef.current) {
      cancelAnimationFrame(fadeRafRef.current);
    }
    fadeRafRef.current = requestAnimationFrame(() => {
      setIsImageFading(false);
    });

    return () => {
      if (fadeRafRef.current) {
        cancelAnimationFrame(fadeRafRef.current);
      }
    };
  }, [activeIndex]);

  return (
    <main className="w-full max-w-[1200px] mx-auto space-y-10 py-8 px-3 sm:px-6 lg:px-4">
      <section className="grid grid-cols-1 lg:grid-cols-2 gap-10 bg-white dark:bg-neutral-900 border rounded-xl shadow p-5 items-stretch">
        <div className="space-y-4">
          <div
            className="relative aspect-square bg-white rounded-xl overflow-hidden cursor-pointer border"
            onClick={() => setIsModalOpen(true)}
          >
            <Image
              key={mainImage}
              src={mainImage}
              alt={data.name}
              fill
              className={`object-contain hover:scale-[1.02] transition-opacity duration-300 ease-in-out ${
                isImageFading ? "opacity-0" : "opacity-100"
              }`}
            />
          </div>

          <div className="relative">
            <Carousel className="w-full">
              <CarouselContent className="flex gap-2 px-10">
                {images.map((img, i) => (
                  <CarouselItem key={i} className="basis-1/6 min-w-[72px]">
                    <button
                      onClick={() => setActiveIndex(i)}
                      className={`relative w-full aspect-square rounded-lg overflow-hidden border transition ${
                        activeIndex === i
                          ? "border-[#3c9ee0] ring-2 ring-[#3c9ee0]"
                          : "border-gray-300 hover:border-gray-500"
                      }`}
                    >
                      <Image
                        fill
                        src={img.imageUrl}
                        alt=""
                        className="object-cover"
                      />
                    </button>
                  </CarouselItem>
                ))}
              </CarouselContent>

              <CarouselPrevious className="absolute left-1 top-1/2 -translate-y-1/2 z-20 bg-white shadow hover:bg-gray-100 text-gray-700 border rounded-full size-8" />
              <CarouselNext className="absolute right-1 top-1/2 -translate-y-1/2 z-20 bg-white shadow hover:bg-gray-100 text-gray-700 border rounded-full size-8" />
            </Carousel>
          </div>
        </div>

        <section className="space-y-7">
          <div className="flex justify-between gap-2">
            <h1 className="text-3xl font-semibold tracking-tight">
              {data.name}
            </h1>
            <WishlistButton
              productId={data.id}
              userId={userId}
              isWishlisted={isWishlisted}
            />
          </div>

          <div className="space-y-1">
            {data.brand && (
              <p className="text-gray-600 dark:text-gray-300 text-sm">
                Brand: <span className="font-medium">{data.brand}</span>
              </p>
            )}
            <Link
              href={`/store/${data.store.slug}`}
              className="text-blue-600 text-sm hover:underline font-medium"
            >
              Visit Store — {data.store.name}
            </Link>
            <p className="flex items-center gap-1 text-sm text-yellow-600">
              <Star className="w-4 h-4 fill-yellow-500 text-yellow-500" /> 4.7 •
              3,841 ratings
            </p>
          </div>

          <p
            className={`px-3 py-1 w-fit text-sm rounded-full shadow-sm
          ${
            inStock ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
          }`}
          >
            {inStock ? `In Stock — ${totalStock} available` : "Out of Stock"}
          </p>

          <div className="p-6 rounded-xl border bg-white dark:bg-neutral-900 shadow space-y-2">
            <div className="text-4xl font-semibold text-gray-900 dark:text-gray-100">
              {formatMoneyFromUSD(priceUSD)}
            </div>

            {discount && oldPriceUSD !== null && (
              <p className="flex items-center gap-2 text-red-600 text-sm">
                <span className="font-bold bg-red-100 px-2 py-0.5 rounded">
                  {discount}% OFF
                </span>
                <span className="line-through text-gray-500">
                  {formatMoneyFromUSD(oldPriceUSD)}
                </span>
              </p>
            )}
          </div>

          {colors.length > 0 && (
            <div>
              <p className="font-medium mb-2">Color</p>
              <div className="flex flex-wrap gap-2">
                {colors.map((c) => (
                  <button
                    key={c}
                    onClick={() => setSelectedColor(c)}
                    className={`px-3 py-1 text-sm rounded-full border capitalize transition
                    ${
                      selectedColor === c
                        ? "bg-amber-600 text-white border-amber-600"
                        : "border-gray-400 hover:border-amber-600"
                    }`}
                  >
                    {c}
                  </button>
                ))}
              </div>
            </div>
          )}

          {sizes.length > 0 && (
            <div>
              <p className="font-medium mb-2">Size</p>
              <div className="flex flex-wrap gap-2">
                {sizes.map((s) => (
                  <button
                    key={s}
                    onClick={() => setSelectedSize(s)}
                    className={`px-3 py-1 text-sm rounded-full border uppercase transition
                    ${
                      selectedSize === s
                        ? "bg-amber-600 text-white border-amber-600"
                        : "border-gray-400 hover:border-amber-600"
                    }`}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          )}

          <AddToCartControl
            productId={data.id}
            variantId={selectedVariant?.id ?? null}
          />

          <div className="border p-4 rounded-xl bg-gray-50 dark:bg-neutral-900 space-y-2 text-sm">
            <p className="flex items-center gap-2">
              <Truck className="w-4 h-4 text-green-600" /> Fast delivery
              available
            </p>
            <p className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-blue-600" /> Secure
              transaction
            </p>
          </div>
        </section>
      </section>

      {data.description && (
        <section className="bg-white dark:bg-neutral-900 border rounded-xl shadow-sm">
          <h2 className="font-semibold text-lg p-4">Product Details</h2>
          <Separator />
          <p className="p-4 text-gray-700 text-sm sm:text-base leading-relaxed">
            {data.description}
          </p>
        </section>
      )}

      <section className="bg-white dark:bg-neutral-900 border rounded-xl shadow-sm">
        <h2 className="font-semibold text-lg p-4">
          Specifications Information
        </h2>
        <Separator />

        <div className="p-6 grid grid-cols-1 gap-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="border rounded-lg shadow-sm">
              <h3 className="font-semibold text-lg p-4 border-b">
                Key Features
              </h3>
              <div className="p-4">
                {Array.isArray(data.specifications) &&
                data.specifications.length > 0 ? (
                  <ul className="list-disc pl-6 space-y-1 text-sm text-gray-700">
                    {data.specifications.map((s, i) => (
                      <li key={i}>{s}</li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-gray-500 text-sm">No data available</p>
                )}
              </div>
            </div>

            <div className="border rounded-lg shadow-sm">
              <h3 className="font-semibold text-lg p-4 border-b">
                What's in the box
              </h3>
              <div className="p-4">
                <p className="text-gray-500 text-sm">No data available</p>
              </div>
            </div>
          </div>

          <div className="border rounded-lg shadow-sm">
            <h3 className="font-semibold text-lg p-4 border-b">
              Technical Details
            </h3>
            <div className="p-4">
              {Array.isArray(data.technicalDetails) &&
              data.technicalDetails.length > 0 ? (
                <dl className="space-y-3">
                  {data.technicalDetails.map((item, i) => {
                    const t = item as { key: string; value: string };
                    return (
                      <span
                        key={i}
                        className="grid grid-cols-1 sm:grid-cols-[1fr_3fr] gap-2 "
                      >
                        <span className="font-semibold">{t.key}:</span>
                        <span className="text-gray-600 text-sm break-words">
                          {t.value}
                        </span>
                      </span>
                    );
                  })}
                </dl>
              ) : (
                <p className="text-gray-500 text-sm">No data available</p>
              )}
            </div>
          </div>
        </div>
      </section>

      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogPortal>
          <DialogOverlay className="fixed inset-0 z-50" />
          <DialogContent className="z-50 border-none shadow-none bg-white p-0 max-w-5xl w-full flex flex-col items-center justify-center">
            <DialogTitle className="sr-only">Image Preview</DialogTitle>
            <DialogTitle className="pt-4 -ml-64">Product Image</DialogTitle>

            <DialogClose asChild>
              <button className="absolute hidden top-4 right-4 text-white hover:text-gray-300">
                <X className="w-7 h-7" />
              </button>
            </DialogClose>

            <Carousel className="w-full max-w-4xl">
              <CarouselContent>
                {images.map((img, i) => (
                  <CarouselItem key={i} className="flex justify-center">
                    <div className="relative w-full h-[75vh]">
                      <Image
                        src={img.imageUrl}
                        alt="preview"
                        fill
                        className="object-contain"
                      />
                    </div>
                  </CarouselItem>
                ))}
              </CarouselContent>

              <CarouselPrevious className="left-5 bg-white text-black shadow hover:bg-gray-100 transition opacity-100" />
              <CarouselNext className="right-5 bg-white text-black shadow hover:bg-gray-100 transition opacity-100" />
            </Carousel>
          </DialogContent>
        </DialogPortal>
      </Dialog>
    </main>
  );
}
