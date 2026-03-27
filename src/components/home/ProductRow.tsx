import { prisma } from "@/lib/prisma";
import { Prisma } from "@/generated/prisma";
import {
  mapRecordProductImagesWithStoreMedia,
  productImageWithAssetInclude,
} from "@/lib/product-images";
import { FullProduct } from "@/lib/types";
import { storeMediaInclude } from "@/lib/media-views";
import ProductRowUI from "./ProductRowUI";

type ProductRowProps = {
  title: string;
  type: "new" | "discounts" | "trending" | "top_Rated";
  autoplay?: boolean;
};

type ProductRowRecord = Prisma.ProductGetPayload<{
  include: {
    images: {
      include: typeof productImageWithAssetInclude;
    };
    variants: true;
    store: {
      include: typeof storeMediaInclude;
    };
  };
}>;

export default async function ProductRow({
  title,
  type,
  autoplay,
}: ProductRowProps) {
  let products: ProductRowRecord[] = [];

  if (type === "new") {
    products = await prisma.product.findMany({
      where: { isPublished: true },
      include: {
        images: { include: productImageWithAssetInclude },
        variants: true,
        store: { include: storeMediaInclude },
      },
      orderBy: { createdAt: "desc" },
      take: 12,
    });
  }

  if (type === "discounts") {
    products = await prisma.product.findMany({
      where: {
        isPublished: true,
        variants: {
          some: { discount: { gt: 0 } },
        },
      },
      include: {
        images: { include: productImageWithAssetInclude },
        variants: true,
        store: { include: storeMediaInclude },
      },
      orderBy: { createdAt: "desc" },
      take: 12,
    });
  }

  if (type === "trending") {
    products = await prisma.product.findMany({
      where: { isPublished: true },
      include: {
        images: { include: productImageWithAssetInclude },
        variants: true,
        store: { include: storeMediaInclude },
      },
      orderBy: { sold: "desc" },
      take: 12,
    });
  }

  if (type === "top_Rated") {
    products = await prisma.product.findMany({
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
  }

  if (products.length === 0) return null;

  const normalizedProducts = products.map((product) =>
    mapRecordProductImagesWithStoreMedia(product),
  ) as FullProduct[];

  const sortMap: Record<typeof type, string> = {
    new: "new",
    discounts: "discount",
    trending: "trending",
    top_Rated: "top_Rated",
  };

  return (
    <ProductRowUI
      title={title}
      products={normalizedProducts}
      autoplay={autoplay}
      seeAllLink={`/products?sort=${sortMap[type]}`}
    />
  );
}
