import { redirect } from "next/navigation";
import { CurrentUser } from "@/lib/currentUser";
import CurrencyRateBootstrap from "@/components/currency/CurrencyRateBootstrap";
import MarketplaceLayoutClient from "./layout-client";

export default async function MarketPlaceLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await CurrentUser();

  if (!user) redirect("/auth/login");
  if (user.role === "USER") redirect("/");

  return (
    <MarketplaceLayoutClient user={user}>
      <CurrencyRateBootstrap />
      {children}
    </MarketplaceLayoutClient>
  );
}
