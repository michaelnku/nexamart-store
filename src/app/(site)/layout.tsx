import Footer from "@/components/layout/Footer";
import MarketPlaceNavbar from "@/components/layout/MarketPlaceNavbar";
import SiteNavbar from "@/components/layout/Navbar";
import { CurrentUser } from "@/lib/currentUser";

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
        user?.role === "RIDER" ||
        user?.role === "ADMIN" ||
        user?.role === "MODERATOR") && <MarketPlaceNavbar initialUser={user} />}

      {/* PAGE CONTENT */}
      <main className="flex-1 min-h-0 pt-16">{children}</main>

      {/* FOOTER */}
      <Footer />
    </div>
  );
}
