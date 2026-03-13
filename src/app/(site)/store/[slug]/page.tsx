import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import Link from "next/link";
import { CurrentUser } from "@/lib/currentUser";
import StoreMaintenancePage from "./_components/StoreMaintenancePage";
import FollowStoreButton from "./_components/FollowStoreButton";
import StoreRatingSummary from "./_components/StoreRatingSummary";
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
import StoreFrontClient from "./_components/StoreFrontClient";

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

export default async function Page({ params }: StoreFrontProps) {
  const { slug } = await params;
  const user = await CurrentUser();

  if (!slug) return notFound();

  const store = await getStoreBySlug(slug);

  if (!store || store.isDeleted) return notFound();

  if (!store.isActive) {
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

  return (
    <StoreFrontClient
      store={{
        id: store.id,
        slug: store.slug,
        name: store.name,
        logo: store.logo,
        bannerImage: store.bannerImage,
        description: store.description,
        location: store.location,
        products: store.products.map((product) => ({
          id: product.id,
          name: product.name,
          basePriceUSD: product.basePriceUSD,
          imageUrl: product.images?.[0]?.imageUrl ?? "/placeholder.png",
        })),
      }}
      isOwner={isOwner}
      performanceBadge={performance?.badge ?? null}
      ratingSummary={<StoreRatingSummary storeId={store.id} />}
      followAction={
        user?.role !== "SELLER" ? (
          <FollowStoreButton storeId={store.id} />
        ) : null
      }
      ownerBanner={
        isOwner ? (
          <div className="border-t border-yellow-300 bg-yellow-50 p-3 text-sm text-yellow-800 dark:border-yellow-900/60 dark:bg-yellow-950/30 dark:text-yellow-300">
            You're viewing your public storefront.
            <Link
              href="/marketplace/dashboard"
              className="ml-1 font-medium text-blue-500 underline"
            >
              Dashboard
            </Link>
          </div>
        ) : null
      }
    />
  );
}
