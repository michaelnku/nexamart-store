import dynamic from "next/dynamic";
import MarketPlaceNavbar from "@/components/layout/MarketPlaceNavbar";
import SiteNavbar from "@/components/layout/Navbar";
import { CurrentUser } from "@/lib/currentUser";

// ✅ Lazy-load footer
const Footer = dynamic(() => import("@/components/layout/Footer"), {
  ssr: false,
  loading: () => <div className="h-24 bg-[#232F3E] animate-pulse" />,
});

export default async function SiteLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await CurrentUser();

  return (
    <div className="min-h-screen flex flex-col">
      {/* NAVBAR */}
      {(!user || user.role === "USER") && <SiteNavbar initialUser={user} />}

      {(user?.role === "SELLER" ||
        user?.role === "ADMIN" ||
        user?.role === "MODERATOR") && <MarketPlaceNavbar initialUser={user} />}

      {/* PAGE CONTENT */}
      <main className="flex-1">{children}</main>

      {/* LAZY FOOTER */}
      <Footer />
    </div>
  );
}
