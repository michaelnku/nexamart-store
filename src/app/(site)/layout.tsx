"use client";

import Footer from "@/components/layout/Footer";
import MarketPlaceNavbar from "@/components/layout/MarketPlaceNavbar";
import SiteNavbar from "@/components/layout/Navbar";
import { useCurrentUser } from "@/hooks/getCurrentUser";
import { usePathname } from "next/navigation";

export default function SiteLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = useCurrentUser();
  const pathname = usePathname();

  // Check if route belongs to marketplace dashboard
  const isDashboardRoute = pathname.startsWith("/market-place/dashboard");

  // Check if user role is allowed for marketplace dashboard
  const isMarketplaceDashboard =
    isDashboardRoute &&
    ["SELLER", "RIDER", "ADMIN", "MODERATOR"].includes(user?.role ?? "");

  return (
    <>
      <main>
        {/* Public navbar or normal user navbar */}
        {(!user || user.role === "USER") && (
          <SiteNavbar initialUser={user ?? null} />
        )}

        {/* Marketplace dashboard navbar */}
        {isMarketplaceDashboard && (
          <MarketPlaceNavbar initialUser={user ?? null} />
        )}

        {children}

        <Footer />
      </main>
    </>
  );
}
