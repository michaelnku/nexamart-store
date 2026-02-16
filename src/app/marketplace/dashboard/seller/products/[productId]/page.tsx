import SellerProductDetail from "@/components/product/SellerProductDetail";
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

  const product = await prisma.product.findFirst({
    where: {
      id: productId,
      store: {
        userId: user.id,
      },
    },
    include: {
      images: true,
      variants: true,
      store: true,
      category: true,
    },
  });

  if (!product) {
    return redirect("/marketplace/dashboard/seller/products");
  }

  return (
    <div className="">
      <SellerProductDetail data={product} />
    </div>
  );
}

