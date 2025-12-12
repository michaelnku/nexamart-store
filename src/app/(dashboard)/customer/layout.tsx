"use client";

import { useCurrentUser } from "@/hooks/getCurrentUser";
import Dashboard from "./_component/Dashboard";
import { redirect } from "next/navigation";

export default function CustomerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = useCurrentUser();

  if (user?.role !== "USER") redirect("/market-place/dashboard");

  return (
    <div className="h-screen flex bg-background">
      <aside className="hidden md:block w-64 shrink-0 overflow-hidden bg-white border-r">
        <Dashboard />
      </aside>

      <main className="flex-1 overflow-y-auto px-4 md:px-8 py-6">
        {children}
      </main>
    </div>
  );
}
