import ProductPublicDetail from "@/components/product/PublicProductDetail";
import { CurrentUserId } from "@/lib/currentUser";
import { prisma } from "@/lib/prisma";
import { createProductSlug } from "@/lib/productSlug";
import { redirect } from "next/navigation";

type PageProps = {
  params: Promise<{ slug: string }>;
};

export default async function Page({ params }: PageProps) {
  const userId = await CurrentUserId();

  const rawSlug = (await params).slug;

  const productId = rawSlug.split("-").at(-1)!;

  const product = await prisma.product.findUnique({
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
  if (!product || product.variants.length === 0) {
    return <div>Product not found</div>;
  }

  const canonicalSlug = createProductSlug(product.name, product.id);

  if (rawSlug === product.id) {
    redirect(`/product/${canonicalSlug}`);
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
