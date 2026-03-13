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
    <div className={`flex min-h-dvh flex-col ${usesSiteNavbar ? "pt-16" : "pt-0"}`}>
      <SiteLayoutClient user={user} />
      <main className="flex flex-1 min-h-0">
        <div className="h-full min-h-0 w-full overflow-x-hidden [&_.h-full]:h-full [&_.min-h-full]:min-h-full">
          <NotificationListener userId={userId!} />
          {children}
        </div>
      </main>
      <Footer />
    </div>
  );
}
