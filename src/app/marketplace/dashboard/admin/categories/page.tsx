import { redirect } from "next/navigation";
import { getCategoriesAction } from "@/actions/category/categories";
import { CurrentUser } from "@/lib/currentUser";
import CategoryPageClient from "@/components/categories/CategoryPageClient";
import { Category } from "@/lib/types";

type CategoryWithMedia = Category & {
  iconUrl?: string | null;
  bannerUrl?: string | null;
};

export default async function AdminCategoriesPage() {
  const user = await CurrentUser();

  if (!user || user.role !== "ADMIN") {
    redirect("/403");
  }

  const res = await getCategoriesAction();
  const categories = (res.categories ?? []).map((cat) => ({
    ...cat,
    iconUrl: (cat as any).iconUrl ?? cat.iconImage ?? null,
    bannerUrl: (cat as any).bannerUrl ?? cat.bannerImage ?? null,
  })) as CategoryWithMedia[];

  return <CategoryPageClient categories={categories} />;
}
