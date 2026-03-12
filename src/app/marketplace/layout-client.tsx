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
    <div className="flex h-dvh min-h-0 flex-col overflow-hidden">
      <MarketPlaceNavbar initialUser={user} />

      <div className="mx-auto flex min-h-0 w-full flex-1 items-stretch overflow-hidden px-0 sm:px-3 lg:px-5 xl:px-8 2xl:max-w-[1920px]">
        <DashboardSidebar initialUser={user} />

        <main className="min-h-0 min-w-0 flex-1 overflow-y-auto overscroll-contain px-3 py-3 sm:px-4 sm:py-4 md:px-5 md:py-5 lg:px-6 lg:py-6 xl:px-8">
          {children}
        </main>
      </div>
    </div>
  );
}
