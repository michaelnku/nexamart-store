import PublicProductCard from "@/components/product/PublicProductCard";
import { prisma } from "@/lib/prisma";
import {
  mapRecordProductImages,
  productImageWithAssetInclude,
} from "@/lib/product-images";
import { categoryMediaInclude, mapCategoryMedia } from "@/lib/media-views";
import Image from "next/image";
import Link from "next/link";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";

type Props = {
  params: Promise<{ slug: string }>;
};

export default async function CategorySlugPage({ params }: Props) {
  const { slug } = await params;

  const category = await prisma.category.findUnique({
    where: { slug },
    include: {
      ...categoryMediaInclude,
      parent: {
        include: {
          parent: {
            include: categoryMediaInclude,
          },
          ...categoryMediaInclude,
        },
      },
      children: {
        include: categoryMediaInclude,
      },
    },
  });

  if (!category) return <p>Category not found</p>;

  const normalizedCategory = {
    ...mapCategoryMedia(category),
    parent: category.parent
      ? {
          ...mapCategoryMedia(category.parent),
          parent: category.parent.parent
            ? mapCategoryMedia(category.parent.parent)
            : null,
        }
      : null,
    children: category.children.map(mapCategoryMedia),
  };

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

  const path: { name: string; slug: string }[] = [];

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

  return (
    <main className="max-w-7xl mx-auto px-4 sm:px-6 py-8 space-y-10">
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

          {path.map((p) => (
            <span
              key={p.slug}
              className={
                path.length > 1
                  ? "hidden sm:flex items-center"
                  : "flex items-center"
              }
            >
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbLink
                  href={`/category/${p.slug}`}
                  className="truncate max-w-[160px]"
                  title={p.name}
                >
                  {p.name}
                </BreadcrumbLink>
              </BreadcrumbItem>
            </span>
          ))}

          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage
              className="truncate max-w-[180px]"
              title={normalizedCategory.name}
            >
              {normalizedCategory.name}
            </BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      {normalizedCategory.bannerImage && (
        <div className="relative h-56 rounded-xl overflow-hidden">
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
          <h1 className="text-2xl sm:text-3xl font-bold">
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
            {normalizedCategory.children.map((sub) => (
              <Link
                key={sub.id}
                href={`/category/${sub.slug}`}
                className="
                  px-4 py-2 rounded-full border text-sm font-medium
                  hover:bg-muted transition
                "
              >
                {sub.name}
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
          <div
            className="
            grid grid-cols-2 
            sm:grid-cols-3 
            md:grid-cols-4 
            lg:grid-cols-5 
            gap-4 sm:gap-6
          "
          >
            {normalizedProducts.map((p) => (
              <PublicProductCard key={p.id} product={p} isWishlisted={false} />
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
async function getCategoryAndDescendantIds(categoryId: string) {
  const categories = await prisma.category.findMany({
    where: {
      OR: [
        { id: categoryId },
        { parentId: categoryId },
        {
          parent: {
            parentId: categoryId,
          },
        },
      ],
    },
    select: { id: true },
  });

  return categories.map((c) => c.id);
}
