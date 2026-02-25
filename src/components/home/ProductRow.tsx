import { prisma } from "@/lib/prisma";
import { FullProduct } from "@/lib/types";
import ProductRowUI from "./ProductRowUI";

type ProductRowProps = {
  title: string;
  type: "New" | "Discounts" | "Trending" | "Top_Rated";
  autoplay?: boolean;
};

export default async function ProductRow({
  title,
  type,
  autoplay,
}: ProductRowProps) {
  let products: FullProduct[] = [];

  if (type === "New") {
    products = await prisma.product.findMany({
      where: { isPublished: true },
      include: { images: true, variants: true, store: true },
      orderBy: { createdAt: "desc" },
      take: 12,
    });
  }

  if (type === "Discounts") {
    products = await prisma.product.findMany({
      where: {
        isPublished: true,
        variants: {
          some: { discount: { gt: 0 } },
        },
      },
      include: { images: true, variants: true, store: true },
      orderBy: { createdAt: "desc" },
      take: 12,
    });
  }

  if (type === "Trending") {
    products = await prisma.product.findMany({
      where: { isPublished: true },
      include: { images: true, variants: true, store: true },
      orderBy: { sold: "desc" },
      take: 12,
    });
  }

  if (type === "Top_Rated") {
    products = await prisma.product.findMany({
      where: { isPublished: true },
      include: { images: true, variants: true, store: true },
      orderBy: [
        { averageRating: "desc" },
        { reviewCount: "desc" },
        { sold: "desc" },
      ],
      take: 12,
    });
  }

  if (products.length === 0) return null;

  const sortMap: Record<typeof type, string> = {
    New: "New",
    Discounts: "Discount",
    Trending: "Trending",
    Top_Rated: "Top_Rated",
  };

  return (
    <ProductRowUI
      title={title}
      products={products}
      autoplay={autoplay}
      seeAllLink={`/products?sort=${sortMap[type]}`}
    />
  );
}
