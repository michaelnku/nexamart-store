import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { CurrentUser } from "@/lib/currentUser";
import { mapProductImagesToView } from "@/lib/product-images";
import { buildNoIndexMetadata, buildStoreMetadata } from "@/lib/seo/seo.metadata";
import { getPublicStoreBySlug } from "@/lib/seo/seo.public";
import {
  buildBreadcrumbStructuredData,
  buildStoreStructuredData,
  serializeJsonLd,
} from "@/lib/seo/seo.structured-data";
import { calculateStorePrepPerformance } from "@/lib/store/calculateStorePrepPerformance";

import FollowStoreButton from "./_components/FollowStoreButton";
import StoreFrontClient from "./_components/StoreFrontClient";
import StoreMaintenancePage from "./_components/StoreMaintenancePage";
import StoreRatingSummary from "./_components/StoreRatingSummary";

interface StoreFrontProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({
  params,
}: StoreFrontProps): Promise<Metadata> {
  const { slug } = await params;
  const store = await getPublicStoreBySlug(slug);

  if (!store || store.isDeleted) {
    return buildNoIndexMetadata({
      title: "Store Not Found",
      description: "The requested store could not be found.",
      path: `/store/${slug}`,
    });
  }

  return buildStoreMetadata(store);
}

export default async function StorePage({ params }: StoreFrontProps) {
  const { slug } = await params;
  const user = await CurrentUser();

  if (!slug) return notFound();

  const store = await getPublicStoreBySlug(slug);

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
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: serializeJsonLd(
            buildBreadcrumbStructuredData([
              { name: "Home", path: "/" },
              { name: "Stores", path: "/store" },
              { name: store.name, path: `/store/${store.slug}` },
            ]),
            buildStoreStructuredData(store),
          ),
        }}
      />

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
            imageUrl:
              mapProductImagesToView(product.images)[0]?.imageUrl ??
              "/placeholder.png",
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
              You&apos;re viewing your public storefront.
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
    </>
  );
}
