import ProductForm from "@/app/market-place/_components/ProductForm";
import { prisma } from "@/lib/prisma";

const page = async () => {
  const categories = await prisma.category.findMany({
    orderBy: { name: "asc" },
  });
  return (
    <div className="w-full min-h-screen">
      <ProductForm categories={categories} />
    </div>
  );
};

export default page;
