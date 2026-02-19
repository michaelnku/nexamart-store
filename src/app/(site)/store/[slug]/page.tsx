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

  return (
    <section className="min-h-full p-6 dark:bg-zinc-900">
      <main className="max-w-6xl mx-auto space-y-12 shadow-md rounded-md ">
        <div>
          <div className="relative w-full h-48 md:h-64 rounded-tr-md rounded-tl-md overflow-hidden bg-gray-200 shadow">
            {store.bannerImage ? (
              <Image
                src={store.bannerImage}
                alt="Store Banner"
                fill
                className="object-cover"
              />
            ) : (
              <div className="flex items-center justify-center w-full h-full text-gray-500">
                Store Banner
              </div>
            )}
          </div>

          {isOwner && (
            <div className="bg-yellow-50 border border-yellow-300 text-yellow-800 p-3 rounded-br-md rounded-bl-md">
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
          <div className="w-32 h-32 rounded-full overflow-hidden border shadow bg-gray-50 -mt-20">
            {store.logo ? (
              <Image
                src={store.logo}
                alt={store.name}
                width={128}
                height={128}
                className="object-cover w-full h-full"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-gray-400">
                No Logo
              </div>
            )}
          </div>

          {/* Store Name */}
          <h1 className="text-4xl font-bold">{store.name}</h1>

          {/* Location */}
          {store.location && (
            <p className="text-gray-500">📍{store.location}</p>
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
            <p className="text-gray-600 max-w-2xl">{store.description}</p>
          )}
        </section>

        <section className="space-y-6 px-6 py-6">
          <h2 className="text-2xl font-semibold">Products</h2>

          {store.products.length === 0 ? (
            <span className="text-gray-500 py-8 flex flex-col gap-2 items-center justify-center">
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
                  href={`/product/${product.id}`}
                  className="border rounded-xl p-3 group hover:shadow-md transition"
                >
                  <div className="relative w-full aspect-square rounded-lg overflow-hidden bg-gray-100">
                    <Image
                      src={product.images?.[0]?.imageUrl ?? "/placeholder.png"}
                      alt={product.name}
                      fill
                      className="object-cover group-hover:scale-105 transition"
                    />
                  </div>

                  <div className="mt-3">
                    <p className="font-medium truncate">{product.name}</p>
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
