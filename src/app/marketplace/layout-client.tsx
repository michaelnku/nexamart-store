"use client";

import { useEffect } from "react";
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
  useEffect(() => {
    const previousHtmlOverflow = document.documentElement.style.overflow;
    const previousBodyOverflow = document.body.style.overflow;

    document.documentElement.style.overflow = "hidden";
    document.body.style.overflow = "hidden";

    return () => {
      document.documentElement.style.overflow = previousHtmlOverflow;
      document.body.style.overflow = previousBodyOverflow;
    };
  }, []);

  return (
    <div className="flex h-[100dvh] flex-col overflow-hidden">
      <MarketPlaceNavbar initialUser={user} />

      <div className="mx-auto flex min-h-0 w-full max-w-[1920px] flex-1 items-stretch overflow-hidden md:px-8">
        <DashboardSidebar initialUser={user} />

        <main className="min-w-0 flex-1 overflow-y-auto px-4 py-4 md:px-6 md:py-6 lg:px-8">
          {children}
        </main>
      </div>
    </div>
  );
}
