import ProductGrid from "@/components/products/ProductGrid";
import { CurrentUser } from "@/lib/currentUser";
import { prisma } from "@/lib/prisma";
import { Plus } from "lucide-react";
import Link from "next/link";

const page = async () => {
  const user = await CurrentUser();

  const products = await prisma.product.findMany({
    where: {
      store: {
        userId: user?.id,
      },
    },
  });

  return (
    <div className="w-full min-h-screen bg-zinc-50 dark:bg-zinc-900">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-semibold p-4">My Products</h1>
        <Link
          href={"/market-place/dashboard/seller/products/add-product"}
          className="flex text-blue-700 font-semibold p-4 gap-1"
        >
          <Plus />
          New Product
        </Link>
      </div>
      <ProductGrid products={products} />
    </div>
  );
};

export default page;
