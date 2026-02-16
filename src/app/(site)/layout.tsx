import { CurrentUser } from "@/lib/currentUser";
import SiteLayoutClient from "./layout-client";
import Footer from "@/components/layout/Footer";

export default async function SiteLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await CurrentUser();

  return (
    <div className="flex min-h-dvh flex-col">
      <SiteLayoutClient user={user} />
      <main className="flex flex-1 min-h-0 pt-16">
        <div className="h-full min-h-0 w-full overflow-x-hidden [&_.h-full]:h-full [&_.min-h-full]:min-h-full">
          {children}
        </div>
      </main>
      <Footer />
    </div>
  );
}
