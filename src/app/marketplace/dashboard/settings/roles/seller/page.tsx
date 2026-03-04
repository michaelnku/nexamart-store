import { SellerSettingsPage } from "@/app/marketplace/_components/SettingsPage";
import { CurrentRole } from "@/lib/currentUser";
import { redirect } from "next/navigation";

export default async function SellerRoleSettingsPage() {
  const role = await CurrentRole();
  if (role !== "SELLER") {
    redirect("/403");
  }

  return <SellerSettingsPage />;
}
