"use client";

import Image from "next/image";
import Link from "next/link";
import type { ReactNode } from "react";
import { MapPin } from "lucide-react";

import {
  MarketplaceBannerImagePreview,
  MarketplaceLogoImagePreview,
} from "@/components/media/MarketplaceImagePreview";
import { useFormatMoneyFromUSD } from "@/hooks/useFormatMoneyFromUSD";

type StoreFrontClientProps = {
  store: {
    id: string;
    slug: string;
    name: string;
    logo: string | null;
    bannerImage: string | null;
    description: string | null;
    location: string | null;
    products: Array<{
      id: string;
      name: string;
      basePriceUSD: number;
      imageUrl: string;
    }>;
  };
  isOwner: boolean;
  performanceBadge: string | null;
  ratingSummary: ReactNode;
  reviewsSection: ReactNode;
  followAction: ReactNode;
  ownerBanner: ReactNode;
};

function getPerformanceBadgeClass(badge: string | null) {
  if (badge === "ELITE") {
    return "border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-900/60 dark:bg-emerald-950/40 dark:text-emerald-300";
  }

  if (badge === "RELIABLE") {
    return "border-sky-200 bg-sky-50 text-sky-800 dark:border-sky-900/60 dark:bg-sky-950/40 dark:text-sky-300";
  }

  if (badge === "STANDARD") {
    return "border-amber-200 bg-amber-50 text-amber-800 dark:border-amber-900/60 dark:bg-amber-950/40 dark:text-amber-300";
  }

  if (badge) {
    return "border-rose-200 bg-rose-50 text-rose-800 dark:border-rose-900/60 dark:bg-rose-950/40 dark:text-rose-300";
  }

  return "";
}

export default function StoreFrontClient({
  store,
  isOwner,
  performanceBadge,
  ratingSummary,
  reviewsSection,
  followAction,
  ownerBanner,
}: StoreFrontClientProps) {
  const formatMoneyFromUSD = useFormatMoneyFromUSD();
  const badgeClass = getPerformanceBadgeClass(performanceBadge);

  return (
    <section className="min-h-full bg-[#f8fafc] px-4 py-8 dark:bg-zinc-950 sm:px-6 lg:px-8">
      <main className="mx-auto max-w-7xl overflow-hidden rounded-[32px] border border-slate-200/80 bg-white shadow-[0_32px_90px_-56px_rgba(15,23,42,0.35)] dark:border-zinc-800 dark:bg-zinc-950">
        <div className="relative">
          <MarketplaceBannerImagePreview
            src={store.bannerImage ?? undefined}
            alt={`${store.name} banner`}
            title={`${store.name} Store Banner`}
            triggerClassName="w-full rounded-none border-0 shadow-none"
            imageClassName="object-cover"
            emptyLabel="Store Banner"
          />

          {ownerBanner}
        </div>

        <section className="px-6 pb-8 sm:px-8">
          <div className="flex flex-col gap-6 border-b border-slate-200/80 pb-8 dark:border-zinc-800 lg:flex-row lg:items-end lg:justify-between">
            <div className="flex flex-col items-center gap-4 text-center lg:flex-row lg:items-end lg:gap-5 lg:text-left">
              <MarketplaceLogoImagePreview
                src={store.logo ?? undefined}
                alt={`${store.name} logo`}
                title={`${store.name} Store Logo`}
                triggerClassName="-mt-16 h-28 w-28 rounded-[28px] border-4 border-white bg-white shadow-[0_18px_45px_-30px_rgba(15,23,42,0.35)] dark:border-zinc-950 dark:bg-zinc-900 sm:h-32 sm:w-32 lg:-mt-14"
                imageClassName="object-cover p-0"
                emptyLabel="No Logo"
              />

              <div className="space-y-3 px-1 lg:px-0">
                <div className="flex flex-wrap items-center justify-center gap-2 lg:justify-start">
                  <h1 className="text-3xl font-semibold tracking-tight text-slate-950 dark:text-zinc-100 sm:text-4xl">
                    {store.name}
                  </h1>

                  {performanceBadge ? (
                    <span
                      className={`rounded-full border px-2.5 py-1 text-[11px] font-semibold tracking-[0.08em] ${badgeClass}`}
                    >
                      {performanceBadge.replaceAll("_", " ")}
                    </span>
                  ) : null}
                </div>

                <div className="flex flex-col items-center gap-3 lg:items-start">
                  {store.location ? (
                    <div className="inline-flex items-center gap-2 text-sm text-slate-500 dark:text-zinc-400">
                      <MapPin className="h-4 w-4 text-slate-400 dark:text-zinc-500" />
                      <span>{store.location}</span>
                    </div>
                  ) : null}

                  {ratingSummary}
                </div>

                {store.description ? (
                  <p className="max-w-2xl text-sm leading-7 text-slate-600 dark:text-zinc-300 sm:text-[15px]">
                    {store.description}
                  </p>
                ) : null}
              </div>
            </div>

            {followAction ? (
              <div className="flex justify-center lg:justify-end">
                {followAction}
              </div>
            ) : null}
          </div>

          <section className="mt-10 space-y-6">
            <div className="space-y-1">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500 dark:text-zinc-400">
                Store catalog
              </p>
              <h2 className="text-2xl font-semibold tracking-tight text-slate-950 dark:text-zinc-100">
                Products
              </h2>
            </div>

            {store.products.length === 0 ? (
              <span className="flex flex-col items-center justify-center gap-2 rounded-[28px] border border-dashed border-slate-200/80 bg-slate-50/80 py-10 text-gray-500 dark:border-zinc-800 dark:bg-zinc-900/40 dark:text-zinc-400">
                <p>No products from this store yet!</p>
                {isOwner ? (
                  <Link
                    href="/marketplace/dashboard/seller/products/new"
                    className="font-medium text-[#3c9ee0] underline"
                  >
                    Add Your First Product
                  </Link>
                ) : null}
              </span>
            ) : (
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
                {store.products.map((product) => (
                  <Link
                    key={product.id}
                    href={`/products/${product.id}`}
                    className="group rounded-[24px] border border-slate-200/80 bg-white p-3.5 transition duration-200 hover:-translate-y-0.5 hover:shadow-[0_20px_45px_-28px_rgba(15,23,42,0.3)] dark:border-zinc-800 dark:bg-zinc-900/60"
                  >
                    <div className="relative aspect-square w-full overflow-hidden rounded-[18px] bg-gray-100 dark:bg-zinc-800">
                      <Image
                        src={product.imageUrl}
                        alt={product.name}
                        fill
                        className="object-cover transition group-hover:scale-105"
                      />
                    </div>

                    <div className="mt-4">
                      <p className="truncate font-medium text-slate-950 dark:text-zinc-100">
                        {product.name}
                      </p>
                      <p className="mt-1 text-lg font-semibold text-[#3c9ee0]">
                        {formatMoneyFromUSD(product.basePriceUSD)}
                      </p>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </section>

          {reviewsSection}
        </section>
      </main>
    </section>
  );
}
