import { redirect } from "next/navigation";
import { getCategoriesAction } from "@/actions/category/categories";
import { CurrentUser } from "@/lib/currentUser";
import CategoryPageClient from "../categories/page";

const AdminCategoriesPage = async () => {
  const user = await CurrentUser();

  if (!user || user.role !== "ADMIN") {
    redirect("/403");
  }

  const res = await getCategoriesAction();

  return <CategoryPageClient categories={res.categories ?? []} />;
};

export default AdminCategoriesPage;
