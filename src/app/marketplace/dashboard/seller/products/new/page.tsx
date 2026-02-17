import ProductForm from "@/app/marketplace/_components/ProductForm";
import { CurrentUser } from "@/lib/currentUser";
import { prisma } from "@/lib/prisma";

const page = async () => {
  const user = await CurrentUser();

  if (!user?.id) {
    return null;
  }

  const categories = await prisma.category.findMany({
    orderBy: { name: "asc" },
  });

  const store = await prisma.store.findUnique({
    where: { userId: user.id },
    select: { type: true },
  });

  if (!store) {
    return null;
  }

  return (
    <div className="w-full min-h-screen">
      <ProductForm categories={categories} storeType={store.type} />
    </div>
  );
};

export default page;
