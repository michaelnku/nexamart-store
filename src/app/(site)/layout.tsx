import SiteNavbar from "@/components/layout/Navbar";
import { CurrentUser } from "@/lib/currentUser";
import LazyFooter from "./LazyFooter";
import { redirect } from "next/navigation";

export default async function SiteLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await CurrentUser();

  if (
    user?.role === "SELLER" ||
    user?.role === "RIDER" ||
    user?.role === "ADMIN" ||
    user?.role === "MODERATOR"
  ) {
    return redirect("/market-place/dashboard");
  }

  return (
    <div className="min-h-screen flex flex-col">
      {/* NAVBAR */}
      {(!user || user.role === "USER") && <SiteNavbar initialUser={user} />}

      {/* PAGE CONTENT */}
      <main className="flex-1 pt-16">{children}</main>

      {/* LAZY FOOTER */}
      <LazyFooter />
    </div>
  );
}
