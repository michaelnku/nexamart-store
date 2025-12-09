"use client";

import Image from "next/image";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, Trash, Edit, X } from "lucide-react";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogOverlay,
  DialogPortal,
  DialogTitle,
} from "@/components/ui/dialog";
import { FullProduct } from "@/lib/types";
import { VisuallyHidden } from "@radix-ui/react-visually-hidden";
import Link from "next/link";
import { deleteProductAction } from "@/actions/auth/product";
import { useRouter } from "next/navigation";
import { useMemo, useState, useTransition } from "react";
import { useCurrentUser } from "@/hooks/getCurrentUser";
import { toast } from "sonner";
import { Separator } from "../ui/separator";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselPrevious,
  CarouselNext,
} from "../ui/carousel";

type ProductDetailProps = { data: FullProduct };

const currencySymbol = (currency: string) => {
  const map: Record<string, string> = {
    USD: "$",
    NGN: "₦",
    EUR: "€",
    GBP: "£",
  };
  return map[currency] || currency;
};

export default function SellerProductDetail({ data }: ProductDetailProps) {
  const router = useRouter();
  const user = useCurrentUser();

  const isOwner = user?.role === "SELLER" && data.store?.userId === user.id;

  const [activeIndex, setActiveIndex] = useState(0);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isPending, startTransition] = useTransition();

  const images = data.images ?? [];
  const mainImage = images[activeIndex]?.imageUrl || "/placeholder.png";

  const totalStock = useMemo(
    () => data.variants?.reduce((sum, v) => sum + v.stock, 0) || 0,
    [data.variants]
  );

  const inStock = totalStock > 0;

  const priceDisplay = useMemo(() => {
    const symbol = currencySymbol(data.currency ?? "USD");
    if (!data.variants || data.variants.length === 0)
      return `${symbol}${data.basePrice.toLocaleString()}`;

    const values = data.variants.map((v) => v.price);
    const min = Math.min(...values);
    const max = Math.max(...values);
    return min === max
      ? `${symbol}${min.toLocaleString()}`
      : `${symbol}${min.toLocaleString()} — ${symbol}${max.toLocaleString()}`;
  }, [data.variants, data.basePrice, data.currency]);

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
        router.push("/market-place/dashboard/seller/products");
      }
      setIsDeleting(false);
    });
  };

  return (
    <main className="max-w-7xl mx-auto space-y-10 py-8 px-3 sm:px-6">
      {/* TOP SECTION */}
      <section className="grid grid-cols-1 lg:grid-cols-2 gap-10 bg-white dark:bg-neutral-900 border rounded-xl shadow p-5">
        {/* IMAGES */}
        <div className="space-y-4">
          <div
            className="relative aspect-square bg-white rounded-xl overflow-hidden cursor-pointer border"
            onClick={() => setIsModalOpen(true)}
          >
            <Image
              src={mainImage}
              alt={data.name}
              fill
              className="object-contain hover:scale-[1.02] transition"
            />
          </div>

          {/* THUMBNAIL CAROUSEL */}
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

              {/* Position arrows INSIDE instead of outside */}
              <CarouselPrevious className="absolute left-1 top-1/2 -translate-y-1/2 z-20 bg-white shadow hover:bg-gray-100 text-gray-700 border rounded-full size-8" />
              <CarouselNext className="absolute right-1 top-1/2 -translate-y-1/2 z-20 bg-white shadow hover:bg-gray-100 text-gray-700 border rounded-full size-8" />
            </Carousel>
          </div>
        </div>

        {/* RIGHT INFO */}
        <div className="space-y-6 flex flex-col">
          {/* TITLE + DELETE */}
          <h1 className="text-2xl sm:text-3xl font-semibold leading-snug">
            {data.name}
          </h1>

          {/* BRAND */}
          {data.brand && (
            <p className="text-gray-600 text-sm">
              Brand: <span className="font-medium">{data.brand}</span>
            </p>
          )}

          {/* PRICE BOX */}
          <div className="p-5 border rounded-xl shadow bg-[#f8fafc] space-y-2">
            <p className="text-3xl sm:text-4xl font-bold text-[#111]">
              {priceDisplay}
            </p>
            {savingsPercent && (
              <span className="inline-block bg-yellow-300 text-yellow-900 px-2 py-1 text-xs rounded font-bold shadow">
                Save {savingsPercent}
              </span>
            )}
            <p
              className={`text-sm ${
                inStock ? "text-green-700" : "text-red-600"
              } font-medium`}
            >
              {inStock ? `In Stock — ${totalStock} available` : "Out of Stock"}
            </p>
          </div>

          {/* VARIANTS LIST — DISPLAY ONLY */}
          {data.variants.length > 0 && (
            <div className="border rounded-xl shadow bg-white dark:bg-neutral-800 p-5 space-y-3">
              <h3 className="font-semibold text-lg">Variants</h3>
              <div className="space-y-2">
                {data.variants.map((v, i) => (
                  <div
                    key={i}
                    className="flex flex-wrap justify-between items-center border-b last:border-none py-2 text-sm"
                  >
                    <span>
                      <span className="font-medium ">{v.color}</span>
                      <span className="font-medium pl-4">{v.size}</span>
                    </span>
                    <span className="text-gray-500">
                      {currencySymbol(data.currency ?? "USD")}
                      {v.price.toLocaleString()}
                    </span>
                    <span className="text-gray-500">Stock: {v.stock}</span>
                    <span className="text-gray-400 text-xs">SKU: {v.sku}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* EDIT BUTTON */}
          <div className="flex gap-12">
            <div className="flex-1">
              {isOwner && (
                <Button
                  onClick={() => {
                    router.push(
                      `/market-place/dashboard/seller/products/${data.id}/update`
                    );
                  }}
                  className="w-full bg-[#3c9ee0] hover:bg-[#318bc4] py-4 text-lg rounded-xl shadow flex items-center gap-2 justify-center"
                >
                  <Edit className="w-5 h-5" /> Edit Product
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
                  className="rounded-full shadow shrink-0"
                >
                  <Trash className="w-5 h-5" />
                </Button>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* DESCRIPTION */}
      {data.description && (
        <section className="bg-white dark:bg-neutral-900 border rounded-xl shadow-sm">
          <h2 className="font-semibold text-lg p-4">Product Details</h2>
          <Separator />
          <p className="p-4 text-gray-700 text-sm sm:text-base leading-relaxed">
            {data.description}
          </p>
        </section>
      )}

      {/* SPECS + TECH */}
      <section className="bg-white dark:bg-neutral-900 border rounded-xl shadow-sm">
        <h2 className="font-semibold text-lg p-4">
          Specifications Information
        </h2>
        <Separator />

        <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* KEY FEATURES */}
          <div className="border rounded-lg shadow-sm">
            <h3 className="font-semibold text-lg p-4 border-b">Key Features</h3>
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

          {/* WHAT'S IN THE BOX*/}
          <div className="border rounded-lg shadow-sm">
            <h3 className="font-semibold text-lg p-4 border-b">
              What's in the box
            </h3>
            <div className="p-4">
              <p className="text-gray-500 text-sm">No data available</p>
            </div>
          </div>
          {/* TECH DETAILS */}
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

      {/* IMAGE MODAL */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogPortal>
          <DialogOverlay className="fixed inset-0 z-50" />
          <DialogContent className="z-50 border-none shadow-none bg-white p-0 max-w-5xl w-full flex flex-col items-center justify-center">
            <DialogTitle className="sr-only">Image Preview</DialogTitle>
            <DialogTitle className="pt-4 -ml-64">Product Image</DialogTitle>

            {/* CLOSE BTN */}
            <DialogClose asChild>
              <button className="absolute hidden top-4 right-4 text-white hover:text-gray-300">
                <X className="w-7 h-7" />
              </button>
            </DialogClose>

            {/* SHADCN CAROUSEL */}
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

              {/* Hover buttons */}
              <CarouselPrevious className="left-5 bg-white/30 hover:bg-white text-black hover:text-black transition opacity-0 group-hover:opacity-100" />
              <CarouselNext className="right-5 bg-white/30 hover:bg-white text-black hover:text-black transition opacity-0 group-hover:opacity-100" />
            </Carousel>
          </DialogContent>
        </DialogPortal>
      </Dialog>
    </main>
  );
}
