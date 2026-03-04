import { CurrentRole } from "@/lib/currentUser";
import { redirect } from "next/navigation";
import MarketplaceSettingsShell from "../_components/marketplace/MarketplaceSettingsShell";

export default async function ModeratorSettingsLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const role = await CurrentRole();
  if (role !== "MODERATOR") {
    redirect("/403");
  }

  return (
    <MarketplaceSettingsShell role="MODERATOR">{children}</MarketplaceSettingsShell>
  );
}
