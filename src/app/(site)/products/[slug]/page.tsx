import type { Metadata } from "next";
import { redirect } from "next/navigation";

import ProductPublicDetail from "@/components/product/PublicProductDetail";
import ReviewList from "@/components/reviews/ReviewList";
import { CurrentRole, CurrentUserId } from "@/lib/currentUser";
import { prisma } from "@/lib/prisma";
import {
  buildNoIndexMetadata,
  buildProductMetadata,
} from "@/lib/seo/seo.metadata";
import { getPublicProductById } from "@/lib/seo/seo.public";
import {
  buildBreadcrumbStructuredData,
  buildProductStructuredData,
  serializeJsonLd,
} from "@/lib/seo/seo.structured-data";
import { createProductSlug } from "@/lib/search/productSlug";
import type { FoodDetails } from "@/lib/types";

type PageProps = {
  params: Promise<{ slug: string }>;
};

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const rawSlug = (await params).slug;
  const productId = rawSlug.split("-").at(-1);

  if (!productId) {
    return buildNoIndexMetadata({
      title: "Product Not Found",
      description: "The requested product could not be found.",
      path: `/products/${rawSlug}`,
    });
  }

  const product = await getPublicProductById(productId);

  if (!product || product.variants.length === 0) {
    return buildNoIndexMetadata({
      title: "Product Not Found",
      description: "The requested product could not be found.",
      path: `/products/${rawSlug}`,
    });
  }

  const canonicalSlug = createProductSlug(product.name, product.id);

  return buildProductMetadata(product, `/products/${canonicalSlug}`);
}

export default async function ProductPage({ params }: PageProps) {
  const userId = await CurrentUserId();
  const userRole = await CurrentRole();

  const rawSlug = (await params).slug;
  const productId = rawSlug.split("-").at(-1);

  if (!productId) {
    return (
      <div className="px-4 py-16 text-center text-slate-600 dark:text-zinc-400">
        Product not found
      </div>
    );
  }

  const product = await getPublicProductById(productId);

  if (!product || product.variants.length === 0) {
    return (
      <div className="px-4 py-16 text-center text-slate-600 dark:text-zinc-400">
        Product not found
      </div>
    );
  }

  const canonicalSlug = createProductSlug(product.name, product.id);
  const canonicalPath = `/products/${canonicalSlug}`;

  if (rawSlug === product.id) {
    redirect(canonicalPath);
  }

  const isWishlisted = userId
    ? Boolean(
        await prisma.wishlistItem.findFirst({
          where: { productId, wishlist: { userId } },
        }),
      )
    : false;

  const cart = userId
    ? await prisma.cart.findUnique({
        where: { userId },
        include: {
          items: {
            include: {
              cartItemSelectedOptions: true,
            },
          },
        },
      })
    : null;

  const defaultVariant = product.variants[0];
  const isFoodProduct = product.store?.type === "FOOD";
  const foodDetails = isFoodProduct
    ? (product.foodDetails as FoodDetails | null)
    : null;
  const productImage = product.images[0]?.imageUrl ?? null;
  const breadcrumbItems = [
    { name: "Home", path: "/" },
    { name: "Products", path: "/products" },
    ...(product.category
      ? [
          {
            name: product.category.name,
            path: `/category/${product.category.slug}`,
          },
        ]
      : []),
    { name: product.name, path: canonicalPath },
  ];

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: serializeJsonLd(
            buildBreadcrumbStructuredData(breadcrumbItems),
            buildProductStructuredData({
              product,
              canonicalPath,
              image: productImage,
            }),
          ),
        }}
      />

      <ProductPublicDetail
        data={product}
        defaultVariant={defaultVariant}
        isWishlisted={isWishlisted}
        cartItems={cart?.items ?? []}
        userId={userId}
        userRole={userRole}
        isFoodProduct={isFoodProduct}
        foodDetails={foodDetails}
      />

      <section className="mx-auto max-w-[1200px] px-4 pb-10 sm:px-6 lg:px-8">
        <div className="space-y-4 rounded-xl border border-slate-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
          <h2 className="text-xl font-semibold text-slate-950 dark:text-zinc-100">
            Verified Reviews
          </h2>
          <ReviewList productId={product.id} />
        </div>
      </section>
    </>
  );
}
