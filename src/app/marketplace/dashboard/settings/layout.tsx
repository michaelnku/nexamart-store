import { CurrentRole } from "@/lib/currentUser";
import { redirect } from "next/navigation";
import MarketplaceSettingsShell from "./_components/MarketplaceSettingsShell";

type MarketplaceRole = "ADMIN" | "SELLER" | "RIDER" | "MODERATOR";

export default async function MarketplaceSettingsLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const role = await CurrentRole();

  if (!role) {
    redirect("/auth/login");
  }

  const allowedRoles: MarketplaceRole[] = [
    "ADMIN",
    "SELLER",
    "RIDER",
    "MODERATOR",
  ];

  if (!allowedRoles.includes(role as MarketplaceRole)) {
    redirect("/403");
  }

  return (
    <MarketplaceSettingsShell role={role as MarketplaceRole}>
      {children}
    </MarketplaceSettingsShell>
  );
}
