import { CurrentRole } from "@/lib/currentUser";
import { redirect } from "next/navigation";
import MarketplaceSettingsShell from "../_components/marketplace/MarketplaceSettingsShell";

export default async function AdminSettingsLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const role = await CurrentRole();
  if (role !== "ADMIN") {
    redirect("/403");
  }

  return <MarketplaceSettingsShell role="ADMIN">{children}</MarketplaceSettingsShell>;
}
