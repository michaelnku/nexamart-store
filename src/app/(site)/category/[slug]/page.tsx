import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";

import PublicProductCard from "@/components/product/PublicProductCard";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { prisma } from "@/lib/prisma";
import {
  mapRecordProductImages,
  productImageWithAssetInclude,
} from "@/lib/product-images";
import {
  buildCategoryMetadata,
  buildNoIndexMetadata,
} from "@/lib/seo/seo.metadata";
import {
  getCategoryAndDescendantIds,
  getPublicCategoryBySlug,
} from "@/lib/seo/seo.public";
import {
  buildBreadcrumbStructuredData,
  buildCategoryCollectionStructuredData,
  serializeJsonLd,
} from "@/lib/seo/seo.structured-data";

type Props = {
  params: Promise<{ slug: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const category = await getPublicCategoryBySlug(slug);

  if (!category) {
    return buildNoIndexMetadata({
      title: "Category Not Found",
      description: "The requested category could not be found.",
      path: `/category/${slug}`,
    });
  }

  return buildCategoryMetadata(category);
}

export default async function CategorySlugPage({ params }: Props) {
  const { slug } = await params;
  const normalizedCategory = await getPublicCategoryBySlug(slug);

  if (!normalizedCategory) {
    return <p>Category not found</p>;
  }

  const categoryIds = await getCategoryAndDescendantIds(normalizedCategory.id);

  const products = await prisma.product.findMany({
    where: {
      isPublished: true,
      categoryId: {
        in: categoryIds,
      },
    },
    include: {
      images: {
        include: productImageWithAssetInclude,
      },
      foodProductConfig: true,
      variants: true,
      store: true,
    },
  });

  const normalizedProducts = products.map((product) =>
    mapRecordProductImages(product),
  );

  const path: Array<{ name: string; slug: string }> = [];

  if (normalizedCategory.parent?.parent) {
    path.push({
      name: normalizedCategory.parent.parent.name,
      slug: normalizedCategory.parent.parent.slug,
    });
  }

  if (normalizedCategory.parent) {
    path.push({
      name: normalizedCategory.parent.name,
      slug: normalizedCategory.parent.slug,
    });
  }

  const breadcrumbItems = [
    { name: "Home", path: "/" },
    { name: "Categories", path: "/category" },
    ...path.map((item) => ({
      name: item.name,
      path: `/category/${item.slug}`,
    })),
    {
      name: normalizedCategory.name,
      path: `/category/${normalizedCategory.slug}`,
    },
  ];

  return (
    <main className="mx-auto max-w-7xl space-y-10 px-4 py-8 sm:px-6">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: serializeJsonLd(
            buildBreadcrumbStructuredData(breadcrumbItems),
            buildCategoryCollectionStructuredData(normalizedCategory),
          ),
        }}
      />

      <Breadcrumb>
        <BreadcrumbList className="flex-wrap text-sm">
          <BreadcrumbItem>
            <BreadcrumbLink href="/category">All Categories</BreadcrumbLink>
          </BreadcrumbItem>

          {path.length > 1 && (
            <>
              <BreadcrumbSeparator />
              <BreadcrumbItem className="sm:hidden">
                <span className="px-1">…</span>
              </BreadcrumbItem>
            </>
          )}

          {path.map((item) => (
            <span
              key={item.slug}
              className={
                path.length > 1
                  ? "hidden items-center sm:flex"
                  : "flex items-center"
              }
            >
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbLink
                  href={`/category/${item.slug}`}
                  className="max-w-[160px] truncate"
                  title={item.name}
                >
                  {item.name}
                </BreadcrumbLink>
              </BreadcrumbItem>
            </span>
          ))}

          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage
              className="max-w-[180px] truncate"
              title={normalizedCategory.name}
            >
              {normalizedCategory.name}
            </BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      {normalizedCategory.bannerImage && (
        <div className="relative h-56 overflow-hidden rounded-xl">
          <Image
            src={normalizedCategory.bannerImage}
            alt={normalizedCategory.name}
            fill
            className="object-cover"
          />
        </div>
      )}

      <section className="flex flex-col gap-4">
        <div className="flex items-center gap-3">
          {normalizedCategory.iconImage && (
            <Image
              src={normalizedCategory.iconImage}
              alt={normalizedCategory.name}
              width={48}
              height={48}
            />
          )}
          <h1 className="text-2xl font-bold sm:text-3xl">
            {normalizedCategory.name}
          </h1>
        </div>

        <p className="text-sm text-muted-foreground">
          {products.length} product{products.length !== 1 && "s"} available
        </p>
      </section>

      {normalizedCategory.children.length > 0 && (
        <section className="space-y-3">
          <h2 className="text-sm font-semibold uppercase text-muted-foreground">
            Browse Subcategories
          </h2>

          <div className="flex flex-wrap gap-2">
            {normalizedCategory.children.map((subcategory) => (
              <Link
                key={subcategory.id}
                href={`/category/${subcategory.slug}`}
                className="rounded-full border px-4 py-2 text-sm font-medium transition hover:bg-muted"
              >
                {subcategory.name}
              </Link>
            ))}
          </div>
        </section>
      )}

      <section className="space-y-6">
        {normalizedProducts.length === 0 ? (
          <div className="py-20 text-center text-muted-foreground">
            No products found in this category.
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 sm:gap-6">
            {normalizedProducts.map((product) => (
              <PublicProductCard
                key={product.id}
                product={product}
                isWishlisted={false}
              />
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
