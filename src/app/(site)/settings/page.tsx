import { getUserAddresses } from "@/components/helper/getUserAddresses";
import SettingsClient from "./_components/SettingsClient";
import AddressSectionSkeleton from "@/components/skeletons/AddressSectionSkeleton";
import { getUserPreferences } from "@/components/helper/getUserPreferences";
import { CurrentUser } from "@/lib/currentUser";
import { redirect } from "next/navigation";

export default async function SettingsPage() {
  const user = await CurrentUser();

  if (!user) {
    redirect("/auth/login");
  }

  if (user.role === "ADMIN") {
    redirect("/settings/admin");
  }

  if (user.role === "SELLER") {
    redirect("/settings/seller");
  }

  if (user.role === "RIDER") {
    redirect("/settings/rider");
  }

  if (user.role === "MODERATOR") {
    redirect("/settings/moderator");
  }

  if (user.role === "USER") {
    redirect("/settings/user/profile");
  }

  const addresses = await getUserAddresses();
  const preferences = await getUserPreferences();

  if (!addresses) return <AddressSectionSkeleton />;

  return (
    <>
      <SettingsClient addresses={addresses} preferences={preferences} />
    </>
  );
}
