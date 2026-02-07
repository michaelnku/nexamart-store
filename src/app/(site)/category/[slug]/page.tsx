import PublicProductCard from "@/components/product/PublicProductCard";
import { prisma } from "@/lib/prisma";
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
      parent: {
        include: {
          parent: true,
        },
      },
      children: true,
    },
  });

  if (!category) return <p>Category not found</p>;

  const categoryIds = await getCategoryAndDescendantIds(category.id);

  const products = await prisma.product.findMany({
    where: {
      isPublished: true,
      categoryId: {
        in: categoryIds,
      },
    },
    include: {
      images: true,
      variants: true,
      store: true,
    },
  });

  const path: { name: string; slug: string }[] = [];

  if (category.parent?.parent) {
    path.push({
      name: category.parent.parent.name,
      slug: category.parent.parent.slug,
    });
  }

  if (category.parent) {
    path.push({
      name: category.parent.name,
      slug: category.parent.slug,
    });
  }

  return (
    <main className="max-w-7xl mx-auto px-4 sm:px-6 py-8 space-y-10">
      <Breadcrumb>
        <BreadcrumbList className="flex-wrap text-sm">
          {/* Root */}
          <BreadcrumbItem>
            <BreadcrumbLink href="/category">All Categories</BreadcrumbLink>
          </BreadcrumbItem>

          {/* Mobile ellipsis */}
          {path.length > 1 && (
            <>
              <BreadcrumbSeparator />
              <BreadcrumbItem className="sm:hidden">
                <span className="px-1">…</span>
              </BreadcrumbItem>
            </>
          )}

          {/* Parent path (desktop only if long) */}
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

          {/* Current page */}
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage
              className="truncate max-w-[180px]"
              title={category.name}
            >
              {category.name}
            </BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      {category.bannerImage && (
        <div className="relative h-56 rounded-xl overflow-hidden">
          <Image
            src={category.bannerImage}
            alt={category.name}
            fill
            className="object-cover"
          />
        </div>
      )}

      <section className="flex flex-col gap-4">
        <div className="flex items-center gap-3">
          {category.iconImage && (
            <Image
              src={category.iconImage}
              alt={category.name}
              width={48}
              height={48}
            />
          )}
          <h1 className="text-2xl sm:text-3xl font-bold">{category.name}</h1>
        </div>

        <p className="text-sm text-muted-foreground">
          {products.length} product{products.length !== 1 && "s"} available
        </p>
      </section>

      {category.children.length > 0 && (
        <section className="space-y-3">
          <h2 className="text-sm font-semibold uppercase text-muted-foreground">
            Browse Subcategories
          </h2>

          <div className="flex flex-wrap gap-2">
            {category.children.map((sub) => (
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
        {products.length === 0 ? (
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
            {products.map((p) => (
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
