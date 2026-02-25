import { redirect } from "next/navigation";
import { getCategoriesAction } from "@/actions/category/categories";
import { CurrentUser } from "@/lib/currentUser";
import CategoryPageClient from "@/components/categories/CategoryPageClient";

type CategoriesResult = Awaited<ReturnType<typeof getCategoriesAction>>;
type CategoryFromAction = NonNullable<CategoriesResult["categories"]>[number];
type CategoryWithMedia = CategoryFromAction & {
  iconUrl?: string | null;
  bannerUrl?: string | null;
};

const AdminCategoriesPage = async () => {
  const user = await CurrentUser();

  if (!user || user.role !== "ADMIN") {
    redirect("/403");
  }

  const res = await getCategoriesAction();

  const categories: CategoryWithMedia[] = (res.categories ?? []).map((cat) => ({
    ...cat,
    iconUrl: cat.iconImage ?? null,
    bannerUrl: cat.bannerImage ?? null,
  }));

  return <CategoryPageClient categories={categories} />;
};

export default AdminCategoriesPage;
