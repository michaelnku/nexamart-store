import ProductRowUI from "@/components/home/ProductRowUI";
import { prisma } from "@/lib/prisma";

export default async function TopRatedProductRow() {
  const products = await prisma.product.findMany({
    where: { isPublished: true },
    include: { images: true, variants: true, store: true },
    orderBy: [
      { averageRating: "desc" },
      { reviewCount: "desc" },
      { sold: "desc" },
    ],
    take: 12,
  });

  if (products.length === 0) return null;

  return (
    <ProductRowUI
      title="Top Rated"
      products={products}
      autoplay={false}
      seeAllLink="/products?sort=Top_Rated"
    />
  );
}
