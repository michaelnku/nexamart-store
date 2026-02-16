"use client";

import MarketPlaceNavbar from "@/components/layout/MarketPlaceNavbar";
import { DashboardSidebar } from "@/components/layout/SideNavbar";
import { UserDTO } from "@/lib/types";

export default function MarketplaceLayoutClient({
  user,
  children,
}: {
  user: UserDTO | null;
  children: React.ReactNode;
}) {
  return (
    <div>
      <MarketPlaceNavbar initialUser={user} />

      <div className="flex max-w-full overflow-x-hidden">
        <DashboardSidebar initialUser={user} />

        <main className="flex-1 w-full max-w-full px-4 md:px-6 py-4 md:ml-64 overflow-x-hidden">
          {children}
        </main>
      </div>
    </div>
  );
}
