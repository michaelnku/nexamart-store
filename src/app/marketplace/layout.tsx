import MarketPlaceNavbar from "@/components/layout/MarketPlaceNavbar";
import { redirect } from "next/navigation";
import { DashboardSidebar } from "../../components/layout/SideNavbar";
import { CurrentUser } from "@/lib/currentUser";
import CurrencyRateBootstrap from "@/components/currency/CurrencyRateBootstrap";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await CurrentUser();

  if (!user) redirect("/auth/login");
  if (user.role === "USER") redirect("/");

  return (
    <div>
      <MarketPlaceNavbar initialUser={user} />

      <div className="flex max-w-full overflow-x-hidden">
        <DashboardSidebar initialUser={user} />

        <main className="flex-1 w-full max-w-full px-4 md:px-6 py-4 md:ml-64 overflow-x-hidden">
          <CurrencyRateBootstrap />
          {children}
        </main>
      </div>
    </div>
  );
}
