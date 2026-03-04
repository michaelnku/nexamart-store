import { CurrentRole } from "@/lib/currentUser";
import { redirect } from "next/navigation";
import { RiderSettingsPage } from "../../_component/RiderSettingsPage";

export default async function RiderRoleSettingsPage() {
  const role = await CurrentRole();
  if (role !== "RIDER") {
    redirect("/403");
  }

  return <RiderSettingsPage />;
}
