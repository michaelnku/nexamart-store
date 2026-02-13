import { prisma } from "@/lib/prisma";
import PublicProductCard from "@/components/product/PublicProductCard";
import { Prisma } from "@/generated/prisma/client";

export const metadata = {
  title: "Products – NexaMart",
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#3c9ee0",
};

type SearchParams = {
  sort?: string;
  minPrice?: string;
  maxPrice?: string;
};

export default async function ProductsPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const { sort, minPrice, maxPrice } = await searchParams;
  const hasBudgetFilter = Boolean(minPrice || maxPrice);
  const normalizedSort = (sort ?? "").trim();

  const orderBy: Prisma.ProductOrderByWithRelationInput =
    sort === "discount"
      ? { createdAt: "desc" }
      : sort === "New"
        ? { createdAt: "desc" }
        : sort === "Top_Rated"
          ? { sold: "desc" }
          : sort === "Trending"
            ? { sold: "desc" }
            : { createdAt: "desc" };

  const sortTitle =
    normalizedSort === "discount"
      ? "Discounted"
      : normalizedSort === "Top_Rated"
        ? "Top Rated"
        : normalizedSort
          ? normalizedSort.replaceAll("-", " ")
          : "Shop";

  const products = await prisma.product.findMany({
    where: {
      isPublished: true,

      ...(sort === "discount"
        ? {
            variants: {
              some: {
                discount: { gt: 0 },
              },
            },
          }
        : {}),

      ...(minPrice || maxPrice
        ? {
            basePriceUSD: {
              ...(minPrice ? { gte: Number(minPrice) } : {}),
              ...(maxPrice ? { lte: Number(maxPrice) } : {}),
            },
          }
        : {}),
    },
    include: {
      images: true,
      variants: true,
      store: true,
    },
    orderBy,
    take: 40,
  });

  return (
    <main className="max-w-7xl mx-auto px-6 py-6 space-y-6">
      <h1 className="text-xl font-semibold">{sortTitle} Products</h1>

      {products.length === 0 ? (
        <div className="rounded-xl border bg-card p-8 text-center">
          <p className="text-base font-medium">
            {hasBudgetFilter
              ? "No products found for this budget. Try another budget-friendly range."
              : "No products found."}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
          {products.map((product) => (
            <PublicProductCard key={product.id} product={product} />
          ))}
        </div>
      )}
    </main>
  );
}
