import UpdateProductForm from "@/app/marketplace/_components/UpdateProductForm";
import { CurrentUser } from "@/lib/currentUser";
import { prisma } from "@/lib/prisma";
import {
  mapRecordProductImages,
  productImageWithAssetInclude,
} from "@/lib/product-images";
import { mapStoreMedia, storeMediaInclude } from "@/lib/media-views";
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
      images: {
        include: productImageWithAssetInclude,
      },
      variants: true,
      foodProductConfig: true,
      foodOptionGroups: {
        orderBy: { displayOrder: "asc" },
        include: {
          options: {
            orderBy: { displayOrder: "asc" },
          },
        },
      },
      store: {
        include: storeMediaInclude,
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

  const normalizedProduct = {
    ...mapRecordProductImages(product),
    store: mapStoreMedia(product.store),
  };

  return (
    <div>
      <UpdateProductForm
        initialData={normalizedProduct}
        categories={categories}
        storeType={normalizedProduct.store.type}
      />
    </div>
  );
}

