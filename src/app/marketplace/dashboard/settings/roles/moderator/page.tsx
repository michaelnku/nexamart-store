import { ModeratorSettingsPage } from "@/app/marketplace/_components/SettingsPage";
import { CurrentRole } from "@/lib/currentUser";
import { redirect } from "next/navigation";

export default async function ModeratorRoleSettingsPage() {
  const role = await CurrentRole();
  if (role !== "MODERATOR") {
    redirect("/403");
  }

  return <ModeratorSettingsPage />;
}
