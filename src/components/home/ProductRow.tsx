import { prisma } from "@/lib/prisma";
import { FullProduct } from "@/lib/types";
import ProductRowUI from "./ProductRowUI";

type ProductRowProps = {
  title: string;
  type: "latest" | "discounts" | "top" | "recommended";
  autoplay?: boolean;
};

export default async function ProductRow({
  title,
  type,
  autoplay,
}: ProductRowProps) {
  let products: FullProduct[] = [];
  if (type === "latest") {
    products = await prisma.product.findMany({
      where: { isPublished: true },
      include: { images: true, variants: true, store: true },
      orderBy: { createdAt: "desc" },
      take: 12,
    });
  }

  if (type === "discounts") {
    products = await prisma.product.findMany({
      where: { isPublished: true, discount: { gt: 0 } },
      include: { images: true, variants: true, store: true },
      orderBy: { discount: "desc" },
      take: 12,
    });
  }

  if (type === "top") {
    products = await prisma.product.findMany({
      where: { isPublished: true },
      include: { images: true, variants: true, store: true },
      orderBy: { sold: "desc" },
      take: 12,
    });
  }

  if (type === "recommended") {
    products = await prisma.product.findMany({
      where: { isPublished: true },
      include: { images: true, variants: true, store: true },
      orderBy: { sold: "desc" },
      take: 12,
    });
  }

  if (products.length === 0) return null;
  return (
    <ProductRowUI
      title={title}
      products={products}
      autoplay={autoplay}
      seeAllLink={`/products?type=${type}`}
    />
  );
}
