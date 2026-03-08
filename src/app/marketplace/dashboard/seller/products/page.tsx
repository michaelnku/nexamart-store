import ProductGrid from "@/components/product/ProductGrid";
import { CurrentUser } from "@/lib/currentUser";
import { prisma } from "@/lib/prisma";
import { Plus } from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";

const page = async () => {
  const user = await CurrentUser();

  if (!user || user.role !== "SELLER") {
    redirect("/403");
  }

  const store = await prisma.store.findFirst({
    where: { userId: user.id },
  });

  if (!store) {
    redirect("/marketplace/dashboard/seller/store/create-store");
  }

  const products = await prisma.product.findMany({
    where: {
      store: {
        userId: user.id,
      },
    },
    include: {
      images: true,
      variants: true,
      store: true,
    },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="dark:bg-zinc-900 max-w-7xl mx-auto px-4 py-6 space-y-8 shadow rounded-lg">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-semibold ">Products</h1>
        <Link
          href={"/marketplace/dashboard/seller/products/new"}
          className="flex text-blue-700 font-semibold p-4 gap-1"
        >
          <Plus />
          <p className="hidden md:block"> New Product</p>
        </Link>
      </div>
      <ProductGrid products={products} />
    </div>
  );
};

export default page;
