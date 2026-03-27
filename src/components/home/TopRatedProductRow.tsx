import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { prisma } from "@/lib/prisma";
import {
  mapRecordProductImagesWithStoreMedia,
  productImageWithAssetInclude,
} from "@/lib/product-images";
import { storeMediaInclude } from "@/lib/media-views";
import TopRatedPaginationSwiper from "./TopRatedPaginationSwiper";

export default async function TopRatedProductRow() {
  const products = await prisma.product.findMany({
    where: { isPublished: true },
    include: {
      images: { include: productImageWithAssetInclude },
      variants: true,
      store: { include: storeMediaInclude },
    },
    orderBy: [
      { averageRating: "desc" },
      { reviewCount: "desc" },
      { sold: "desc" },
    ],
    take: 12,
  });

  if (products.length === 0) return null;

  const normalizedProducts = products.map((product) =>
    mapRecordProductImagesWithStoreMedia(product),
  );

  return (
    <section className="py-6">
      <div className="mx-auto w-full max-w-7xl space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">Top Rated</h2>
          <Link
            href="/products?sort=Top_Rated"
            className="flex items-center text-sm font-medium text-[var(--brand-blue)] hover:underline"
          >
            Explore
            <ChevronRight className="ml-1 h-4 w-4" />
          </Link>
        </div>

        <TopRatedPaginationSwiper products={normalizedProducts} />
      </div>
    </section>
  );
}
