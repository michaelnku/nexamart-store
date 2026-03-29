import { CurrentUser } from "@/lib/currentUser";
import SiteLayoutClient from "./layout-client";
import Footer from "@/components/layout/Footer";
import NotificationListener from "@/components/notifications/NotificationListener";

export default async function SiteLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await CurrentUser();

  const userId = user?.id;
  const usesSiteNavbar = !user || user.role === "USER";

  return (
    <div
      className={`flex min-h-screen flex-col ${usesSiteNavbar ? "pt-16" : "pt-0"}`}
    >
      <SiteLayoutClient user={user} />
      <main className="flex min-h-0 flex-1 flex-col">
        <div className="flex min-h-full flex-1 flex-col overflow-x-hidden">
          {userId ? <NotificationListener userId={userId} /> : null}
          {children}
        </div>
      </main>
      <Footer />
    </div>
  );
}
