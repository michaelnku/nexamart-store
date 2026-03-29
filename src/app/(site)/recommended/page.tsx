import { prisma } from "@/lib/prisma";
import { CurrentUser } from "@/lib/currentUser";
import {
  mapRecordProductImages,
  productImageWithAssetInclude,
} from "@/lib/product-images";
import PublicProductCard from "@/components/product/PublicProductCard";
import { redirect } from "next/navigation";

export const metadata = {
  title: "Recommended For You – NexaMart",
};

export default async function RecommendedPage() {
  const user = await CurrentUser();

  if (!user) redirect("/auth/login");

  const viewedProducts = await prisma.product.findMany({
    where: {
      reviews: {
        some: { userId: user.id },
      },
    },
    select: { id: true, categoryId: true },
    take: 20,
  });

  const viewedProductIds = viewedProducts.map((p) => p.id);
  const viewedCategoryIds = Array.from(
    new Set(viewedProducts.map((p) => p.categoryId)),
  );

  const recommendedProducts =
    viewedCategoryIds.length > 0
      ? (await prisma.product.findMany({
          where: {
            isPublished: true,
            categoryId: { in: viewedCategoryIds },
            id: { notIn: viewedProductIds },
          },
          include: {
            images: {
              include: productImageWithAssetInclude,
            },
            foodProductConfig: true,
            variants: true,
            store: true,
          },
          orderBy: [{ sold: "desc" }, { createdAt: "desc" }],
          take: 40,
        })).map(mapRecordProductImages)
      : [];

  const fallbackProducts =
    recommendedProducts.length === 0
      ? (await prisma.product.findMany({
          where: { isPublished: true },
          include: {
            images: {
              include: productImageWithAssetInclude,
            },
            foodProductConfig: true,
            variants: true,
            store: true,
          },
          orderBy: { sold: "desc" },
          take: 40,
        })).map(mapRecordProductImages)
      : [];

  const products =
    recommendedProducts.length > 0 ? recommendedProducts : fallbackProducts;

  return (
    <main className="mx-auto max-w-7xl space-y-6 px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
      <div className="space-y-1">
        <h1 className="text-xl font-semibold">Recommended For You</h1>

        {recommendedProducts.length === 0 && (
          <p className="text-sm text-muted-foreground">
            We’re still learning your preferences. Showing popular products for
            now.
          </p>
        )}
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
        {products.map((product) => (
          <PublicProductCard key={product.id} product={product} />
        ))}
      </div>
    </main>
  );
}
