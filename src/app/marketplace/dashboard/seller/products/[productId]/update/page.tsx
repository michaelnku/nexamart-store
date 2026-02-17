import UpdateProductForm from "@/app/marketplace/_components/UpdateProductForm";
import { CurrentUser } from "@/lib/currentUser";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";

export default async function Page({
  params,
}: {
  params: Promise<{ productId: string }>;
}) {
  const { productId } = await params;
  const user = await CurrentUser();

  if (!user) {
    redirect("/");
  }

  if (user.role !== "SELLER") {
    return;
  }

  const categories = await prisma.category.findMany({
    orderBy: { name: "asc" },
  });

  const product = await prisma.product.findFirst({
    where: {
      id: productId,
      store: { userId: user.id },
    },
    include: {
      images: true,
      variants: true,
      store: {
        select: {
          id: true,
          userId: true,
          name: true,
          slug: true,
          logo: true,
        },
      },
      reviews: {
        select: {
          id: true,
          orderId: true,
          rating: true,
          comment: true,
          createdAt: true,
          updatedAt: true,
          userId: true,
          productId: true,
          user: {
            select: {
              id: true,
              name: true,
              image: true,
            },
          },
        },
      },
    },
  });

  if (!product) redirect("/marketplace/dashboard/seller/products");

  return (
    <div>
      <UpdateProductForm initialData={product} categories={categories} />
    </div>
  );
}

