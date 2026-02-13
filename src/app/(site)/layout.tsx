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
    <div className="flex min-h-dvh flex-col">
      {(!user || user.role === "USER") && <SiteNavbar initialUser={user} />}

      {(user?.role === "SELLER" ||
        user?.role === "RIDER" ||
        user?.role === "ADMIN" ||
        user?.role === "MODERATOR") && <MarketPlaceNavbar initialUser={user} />}

      <main className="flex flex-1 min-h-0 pt-16">
        <div className="h-full min-h-0 w-full overflow-x-hidden [&_.h-full]:h-full [&_.min-h-full]:min-h-full">
          {children}
        </div>
      </main>

      <Footer />
    </div>
  );
}

