import ProductPublicDetail from "@/components/product/PublicProductDetail";
import { CurrentUserId } from "@/lib/currentUser";
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
        select: { id: true, userId: true, name: true, slug: true, logo: true },
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
  const title = `${product.name} | ${APP_NAME}`;
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
      type: "product",
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

  const rawSlug = (await params).slug;

  const productId = rawSlug.split("-").at(-1)!;

  const product = await getProductById(productId);
  if (!product || product.variants.length === 0) {
    return <div>Product not found</div>;
  }

  const canonicalSlug = createProductSlug(product.name, product.id);

  if (rawSlug === product.id) {
    redirect(`/products/${canonicalSlug}`);
  }

  // const wishlistCount = await prisma.wishlistItem.count({
  //   where: { productId },
  // });

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

  return (
    <ProductPublicDetail
      data={product}
      defaultVariant={defaultVariant}
      isWishlisted={isWishlisted}
      cartItems={cart?.items ?? []}
      userId={userId}
    />
  );
}
