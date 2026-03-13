"use client";

import Image from "next/image";
import Link from "next/link";
import type { ReactNode } from "react";
import { formatBaseUSD } from "@/lib/currency/formatBaseUSD";
import {
  MarketplaceBannerImagePreview,
  MarketplaceLogoImagePreview,
} from "@/components/media/MarketplaceImagePreview";

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
  followAction: ReactNode;
  ownerBanner: ReactNode;
};

function getPerformanceBadgeClass(badge: string | null) {
  if (badge === "ELITE") {
    return "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300";
  }

  if (badge === "RELIABLE") {
    return "bg-blue-100 text-blue-800 dark:bg-blue-950/40 dark:text-blue-300";
  }

  if (badge === "STANDARD") {
    return "bg-amber-100 text-amber-800 dark:bg-amber-950/40 dark:text-amber-300";
  }

  if (badge) {
    return "bg-red-100 text-red-800 dark:bg-red-950/40 dark:text-red-300";
  }

  return "";
}

export default function StoreFrontClient({
  store,
  isOwner,
  performanceBadge,
  ratingSummary,
  followAction,
  ownerBanner,
}: StoreFrontClientProps) {
  const badgeClass = getPerformanceBadgeClass(performanceBadge);

  return (
    <section className="min-h-full bg-white px-4 py-8 dark:bg-zinc-900 sm:px-6 lg:px-8">
      <main className="mx-auto max-w-7xl overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-md dark:border-zinc-800 dark:bg-zinc-950">
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

        <section className="px-6 pb-8">
          <div className="flex flex-col items-center gap-4 text-center">
            <MarketplaceLogoImagePreview
              src={store.logo ?? undefined}
              alt={`${store.name} logo`}
              title={`${store.name} Store Logo`}
              triggerClassName="-mt-16 h-32 w-32 rounded-full border-4 border-white bg-white dark:border-zinc-950 dark:bg-zinc-900"
              imageClassName="object-cover p-0"
              emptyLabel="No Logo"
            />

            <div className="flex flex-wrap items-center justify-center gap-2 px-2">
              <h1 className="text-3xl font-bold text-slate-950 dark:text-zinc-100 sm:text-4xl">
                {store.name}
              </h1>

              {performanceBadge && (
                <span
                  className={`rounded-full px-2.5 py-1 text-xs font-semibold ${badgeClass}`}
                >
                  {performanceBadge.replaceAll("_", " ")}
                </span>
              )}
            </div>

            {store.location && (
              <p className="text-gray-500 dark:text-zinc-400">
                📍{store.location}
              </p>
            )}

            {ratingSummary}

            <div className="flex items-center gap-3">{followAction}</div>

            {store.description && (
              <p className="max-w-2xl text-gray-600 dark:text-zinc-300">
                {store.description}
              </p>
            )}
          </div>

          <section className="mt-10 space-y-6">
            <h2 className="text-2xl font-semibold text-slate-950 dark:text-zinc-100">
              Products
            </h2>

            {store.products.length === 0 ? (
              <span className="flex flex-col items-center justify-center gap-2 py-8 text-gray-500 dark:text-zinc-400">
                <p>No products from this store yet!</p>
                {isOwner && (
                  <Link
                    href="/marketplace/dashboard/seller/products/new"
                    className="text-blue-500 underline"
                  >
                    Add Your First Product!
                  </Link>
                )}
              </span>
            ) : (
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
                {store.products.map((product) => (
                  <Link
                    key={product.id}
                    href={`/products/${product.id}`}
                    className="group rounded-xl border border-slate-200 p-3 transition hover:shadow-md dark:border-zinc-800 dark:bg-zinc-900/60"
                  >
                    <div className="relative aspect-square w-full overflow-hidden rounded-lg bg-gray-100 dark:bg-zinc-800">
                      <Image
                        src={product.imageUrl}
                        alt={product.name}
                        fill
                        className="object-cover transition group-hover:scale-105"
                      />
                    </div>

                    <div className="mt-3">
                      <p className="truncate font-medium text-slate-950 dark:text-zinc-100">
                        {product.name}
                      </p>
                      <p className="text-lg font-semibold text-blue-600">
                        {formatBaseUSD(product.basePriceUSD)}
                      </p>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </section>
        </section>
      </main>
    </section>
  );
}
