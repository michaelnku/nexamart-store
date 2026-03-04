import { CurrentRole } from "@/lib/currentUser";
import { redirect } from "next/navigation";

export default async function MarketplaceRoleSettingsIndexPage() {
  const role = await CurrentRole();

  if (role === "ADMIN") {
    redirect("/marketplace/dashboard/settings/roles/admin");
  }
  if (role === "SELLER") {
    redirect("/marketplace/dashboard/settings/roles/seller");
  }
  if (role === "RIDER") {
    redirect("/marketplace/dashboard/settings/roles/rider");
  }
  if (role === "MODERATOR") {
    redirect("/marketplace/dashboard/settings/roles/moderator");
  }

  redirect("/403");
}
