import PublicProductCard from "@/components/product/PublicProductCard";
import { prisma } from "@/lib/prisma";
import { Category } from "@/lib/types";
import Image from "next/image";
import Link from "next/link";

type Props = {
  params: Promise<{ slug: string }>;
};

export default async function CategorySlugPage({ params }: Props) {
  const { slug } = await params;

  const category = await prisma.category.findUnique({
    where: { slug },
    include: {
      children: true,
      parent: {
        include: {
          parent: true,
        },
      },
    },
  });

  if (!category) return <p>Category not found</p>;

  // fetch products under THIS category and all its sub-categories
  const products = await prisma.product.findMany({
    where: {
      isPublished: true,
      OR: [
        { categoryId: category.id },
        {
          category: {
            parentId: category.id,
          },
        },
      ],
    },
    include: { images: true, variants: true, store: true },
  });

  const path: { name: string; slug: string }[] = [];
  let current = category as Category;
  while (current.parentId) {
    const parent = await prisma.category.findUnique({
      where: { id: current.parentId },
    });
    if (!parent) break;
    path.unshift({ name: parent.name, slug: parent.slug });
    current = parent;
  }

  return (
    <main className="max-w-7xl mx-auto px-6 py-10 space-y-12">
      <nav className="text-sm text-gray-500 flex gap-1">
        <Link href="/category" className="hover:underline">
          All Categories
        </Link>
        {path.map((p) => (
          <>
            <span> / </span>
            <Link
              key={p.slug}
              href={`/category/${p.slug}`}
              className="hover:underline"
            >
              {p.name}
            </Link>
          </>
        ))}
        <span>/</span>
        <span className="font-medium text-black">{category.name}</span>
      </nav>

      {/* BANNER */}
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

      {/* TITLE + ICON */}
      <header className="flex items-center gap-3">
        {category.iconImage && (
          <Image
            src={category.iconImage}
            alt={category.name}
            width={50}
            height={50}
          />
        )}
        <h1 className="text-3xl font-bold">{category.name}</h1>
      </header>

      {/* SUBCATEGORIES */}
      {category.children.length > 0 && (
        <section className="space-y-5">
          <h2 className="text-xl font-semibold">Explore Subcategories</h2>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
            {category.children.map((sub) => (
              <Link
                key={sub.id}
                href={`/category/${sub.slug}`}
                className="border p-4 rounded-lg hover:shadow text-center font-medium"
              >
                {sub.name}
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* PRODUCTS */}
      <section>
        <h2 className="text-xl font-semibold mb-4">
          {products.length > 0 ? "Products" : "No products found"}
        </h2>

        {products.length > 0 && (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-5">
            {products.map((p) => (
              <PublicProductCard key={p.id} product={p} isWishlisted={false} />
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
