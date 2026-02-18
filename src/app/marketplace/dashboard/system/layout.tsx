"use client";

import Link from "next/link";

export default function SystemDashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen">
      {/* Sidebar */}

      {/* Content */}
      <main className="flex-1 p-8 bg-gray-50 dark:bg-neutral-900">
        {children}
      </main>
    </div>
  );
}
