"use client";

import { DashboardSidebar } from "@/components/dashboard/SideNavbar";
import MarketPlaceNavbar from "@/components/layout/MarketPlaceNavbar";
import { useCurrentUserQuery } from "@/stores/useGetCurrentUserQuery";
import { redirect } from "next/navigation";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { data: user } = useCurrentUserQuery();

  // in marketplace layout
  if (user?.role === "USER") redirect("/");

  return (
    <div>
      {/* TOP NAVBAR */}
      <MarketPlaceNavbar initialUser={user ?? null} />

      <div className="flex">
        {/* LEFT SIDEBAR */}
        <DashboardSidebar initialUser={user ?? null} />

        {/* MAIN CONTENT */}
        <main className="flex-1 ml-0 md:ml-64 px-6 py-4">{children}</main>
      </div>
    </div>
  );
}
