import { CurrentRole } from "@/lib/currentUser";
import { redirect } from "next/navigation";
import MarketplaceSettingsShell from "../_components/marketplace/MarketplaceSettingsShell";

export default async function SellerSettingsLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const role = await CurrentRole();
  if (role !== "SELLER") {
    redirect("/403");
  }

  return (
    <MarketplaceSettingsShell role="SELLER">{children}</MarketplaceSettingsShell>
  );
}
