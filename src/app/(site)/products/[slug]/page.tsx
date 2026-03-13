import ProductPublicDetail from "@/components/product/PublicProductDetail";
import ReviewList from "@/components/reviews/ReviewList";
import { CurrentRole, CurrentUserId } from "@/lib/currentUser";
import { prisma } from "@/lib/prisma";
import { createProductSlug } from "@/lib/search/productSlug";
import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { cache } from "react";
import {
  APP_DESCRIPTION,
  APP_LOGO,
  APP_NAME,
  absoluteUrl,
  toSeoDescription,
} from "@/lib/seo";
import { FoodDetails } from "@/lib/types";

type PageProps = {
  params: Promise<{ slug: string }>;
};

const getProductById = cache(async (productId: string) => {
  return prisma.product.findUnique({
    where: { id: productId },
    include: {
      images: true,
      variants: {
        orderBy: { priceUSD: "asc" },
      },
      store: {
        select: {
          id: true,
          userId: true,
          name: true,
          slug: true,
          logo: true,
          type: true,
        },
      },

      reviews: {
        include: {
          user: { select: { id: true, name: true, image: true } },
        },
      },
    },
  });
});

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const rawSlug = (await params).slug;
  const productId = rawSlug.split("-").at(-1);

  if (!productId) {
    return {
      title: `Product Not Found | ${APP_NAME}`,
      description: APP_DESCRIPTION,
      alternates: { canonical: absoluteUrl(`/products/${rawSlug}`) },
    };
  }

  const product = await getProductById(productId);

  if (!product || product.variants.length === 0) {
    return {
      title: `Product Not Found | ${APP_NAME}`,
      description: APP_DESCRIPTION,
      alternates: { canonical: absoluteUrl(`/products/${rawSlug}`) },
    };
  }

  const canonicalSlug = createProductSlug(product.name, product.id);
  const url = absoluteUrl(`/products/${canonicalSlug}`);
  const title = `${product.name}`;
  const description = toSeoDescription(product.description, APP_DESCRIPTION);
  const image = product.images[0]?.imageUrl ?? APP_LOGO;

  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: {
      title,
      description,
      url,
      type: "website",
      images: [
        {
          url: image,
          width: 1200,
          height: 630,
          alt: product.name,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [image],
    },
  };
}

export default async function Page({ params }: PageProps) {
  const userId = await CurrentUserId();
  const userRole = await CurrentRole();

  const rawSlug = (await params).slug;

  const productId = rawSlug.split("-").at(-1)!;

  const product = await getProductById(productId);
  if (!product || product.variants.length === 0) {
    return (
      <div className="px-4 py-16 text-center text-slate-600 dark:text-zinc-400">
        Product not found
      </div>
    );
  }

  const canonicalSlug = createProductSlug(product.name, product.id);

  if (rawSlug === product.id) {
    redirect(`/products/${canonicalSlug}`);
  }

  const isWishlisted = userId
    ? !!(await prisma.wishlistItem.findFirst({
        where: { productId, wishlist: { userId } },
      }))
    : false;

  const cart = userId
    ? await prisma.cart.findUnique({
        where: { userId },
        include: { items: true },
      })
    : null;

  const defaultVariant = product.variants[0];

  const isFoodProduct = product.store?.type === "FOOD";

  const foodDetails = isFoodProduct
    ? (product.foodDetails as FoodDetails | null)
    : null;

  return (
    <>
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
