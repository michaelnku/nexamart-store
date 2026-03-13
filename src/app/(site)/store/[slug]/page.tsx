"use server";

import { prisma } from "@/lib/prisma";
import Image from "next/image";
import { notFound } from "next/navigation";
import Link from "next/link";
import { CurrentUser } from "@/lib/currentUser";
import StoreMaintenancePage from "./_components/StoreMaintenancePage";
import FollowStoreButton from "./_components/FollowStoreButton";
import StoreRatingSummary from "./_components/StoreRatingSummary";
import { formatBaseUSD } from "@/lib/currency/formatBaseUSD";
import type { Metadata } from "next";
import { cache } from "react";
import {
  APP_DESCRIPTION,
  APP_LOGO,
  APP_NAME,
  absoluteUrl,
  toSeoDescription,
} from "@/lib/seo";
import { calculateStorePrepPerformance } from "@/lib/store/calculateStorePrepPerformance";

interface StoreFrontProps {
  params: Promise<{ slug: string }>;
}

const getStoreBySlug = cache(async (slug: string) => {
  return prisma.store.findUnique({
    where: { slug },
    include: {
      products: {
        include: {
          images: true,
        },
      },
      owner: true,
      _count: {
        select: { StoreFollower: true },
      },
    },
  });
});

export async function generateMetadata({
  params,
}: StoreFrontProps): Promise<Metadata> {
  const { slug } = await params;

  const store = await getStoreBySlug(slug);

  if (!store || store.isDeleted) {
    return {
      title: `Store Not Found | ${APP_NAME}`,
      description: APP_DESCRIPTION,
      alternates: { canonical: absoluteUrl(`/store/${slug}`) },
    };
  }

  const title = `${store.name} | ${APP_NAME}`;
  const description = toSeoDescription(
    store.tagline ?? store.description ?? undefined,
    `Shop ${store.name} on ${APP_NAME}. Discover great products and deals from this seller.`,
  );
  const image = store.bannerImage || store.logo || APP_LOGO;
  const url = absoluteUrl(`/store/${store.slug}`);

  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: {
      title,
      description,
      url,
      type: "website",
      images: [
        {
          url: image,
          width: 1200,
          height: 630,
          alt: `${store.name} storefront`,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [image],
    },
  };
}

const page = async ({ params }: StoreFrontProps) => {
  const { slug } = await params;
  const user = await CurrentUser();

  if (!slug) return notFound();

  // Fetch store by slug
  const store = await getStoreBySlug(slug);

  if (!store) return notFound();

  if (!store.isActive) {
    const user = await CurrentUser();

    if (user?.id === store.userId) {
      return <StoreMaintenancePage slug={store.slug} />;
    }

    return notFound();
  }

  const isOwner = user?.id === store.userId;
  const performance =
    store.type === "FOOD"
      ? await calculateStorePrepPerformance(store.id)
      : null;

  const badgeClass =
    performance?.badge === "ELITE"
      ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300"
      : performance?.badge === "RELIABLE"
        ? "bg-blue-100 text-blue-800 dark:bg-blue-950/40 dark:text-blue-300"
        : performance?.badge === "STANDARD"
          ? "bg-amber-100 text-amber-800 dark:bg-amber-950/40 dark:text-amber-300"
          : "bg-red-100 text-red-800 dark:bg-red-950/40 dark:text-red-300";

  return (
    <section className="min-h-full bg-white px-4 py-8 dark:bg-zinc-900 sm:px-6 lg:px-8">
      <main className="mx-auto max-w-7xl space-y-12 rounded-3xl border border-slate-200 bg-white shadow-md dark:border-zinc-800 dark:bg-zinc-950">
        <div>
          <div className="relative h-48 w-full overflow-hidden rounded-t-3xl bg-gray-200 shadow md:h-64 dark:bg-zinc-800">
            {store.bannerImage ? (
              <Image
                src={store.bannerImage}
                alt="Store Banner"
                fill
                className="object-cover"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center text-gray-500 dark:text-zinc-400">
                Store Banner
              </div>
            )}
          </div>

          {isOwner && (
            <div className="rounded-b-3xl border border-yellow-300 bg-yellow-50 p-3 text-yellow-800 dark:border-yellow-900/60 dark:bg-yellow-950/30 dark:text-yellow-300">
              You're viewing your public storefront.
              <Link
                href="/marketplace/dashboard"
                className="underline font-medium ml-1 text-blue-500"
              >
                Dashboard
              </Link>
            </div>
          )}
        </div>

        <section className="flex flex-col items-center gap-4 text-center">
          {/* Logo */}
          <div className="z-50 -mt-20 h-32 w-32 overflow-hidden rounded-full border border-[#125c99] bg-gray-50 shadow dark:bg-zinc-900">
            {store.logo ? (
              <Image
                src={store.logo}
                alt={store.name}
                width={128}
                height={128}
                className="object-cover w-full h-full"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center text-gray-400 dark:text-zinc-500">
                No Logo
              </div>
            )}
          </div>

          {/* Store Name */}
          <div className="flex items-center gap-2 px-2">
            <h1 className="text-4xl font-bold text-slate-950 dark:text-zinc-100">{store.name}</h1>
            {performance && (
              <span
                className={`rounded-full px-2.5 py-1 text-xs font-semibold ${badgeClass}`}
              >
                {performance.badge.replaceAll("_", " ")}
              </span>
            )}
          </div>

          {/* Location */}
          {store.location && (
            <p className="text-gray-500 dark:text-zinc-400">📍{store.location}</p>
          )}

          {/* Rating Summary */}
          <StoreRatingSummary storeId={store.id} />

          {/* FOLLOW BUTTON & COUNT */}
          <div className="flex items-center gap-3">
            {/* Only show button for non-sellers */}
            {user?.role !== "SELLER" && (
              <FollowStoreButton storeId={store.id} />
            )}
          </div>

          {/* Description */}
          {store.description && (
            <p className="max-w-2xl text-gray-600 dark:text-zinc-300">{store.description}</p>
          )}
        </section>

        <section className="space-y-6 px-6 py-6">
          <h2 className="text-2xl font-semibold text-slate-950 dark:text-zinc-100">Products</h2>

          {store.products.length === 0 ? (
            <span className="flex flex-col items-center justify-center gap-2 py-8 text-gray-500 dark:text-zinc-400">
              <p>No products from this store yet! </p>
              {isOwner && (
                <Link
                  href={"/marketplace/dashboard/seller/products/new"}
                  className="underline text-blue-500"
                >
                  Add Your First Product!
                </Link>
              )}
            </span>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {store.products.map((product) => (
                <Link
                  key={product.id}
                  href={`/products/${product.id}`}
                  className="group rounded-xl border border-slate-200 p-3 transition hover:shadow-md dark:border-zinc-800 dark:bg-zinc-900/60"
                >
                  <div className="relative aspect-square w-full overflow-hidden rounded-lg bg-gray-100 dark:bg-zinc-800">
                    <Image
                      src={product.images?.[0]?.imageUrl ?? "/placeholder.png"}
                      alt={product.name}
                      fill
                      className="object-cover group-hover:scale-105 transition"
                    />
                  </div>

                  <div className="mt-3">
                    <p className="truncate font-medium text-slate-950 dark:text-zinc-100">{product.name}</p>
                    <p className="text-blue-600 font-semibold text-lg">
                      {formatBaseUSD(product.basePriceUSD)}
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </section>
      </main>
    </section>
  );
};

export default page;
