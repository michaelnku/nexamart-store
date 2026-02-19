"use client";

import { usePathname } from "next/navigation";
import { useLogout } from "@/hooks/useLogout";
import { useCurrentUserQuery } from "@/stores/useCurrentUserQuery";
import { CustomerSidebarContent } from "./CustomerSidebarContent";

export default function Dashboard() {
  const { data: user } = useCurrentUserQuery();
  const pathname = usePathname() ?? "";
  const logout = useLogout();

  return (
    <aside className="hidden md:block md:sticky md:top-0 md:h-full md:w-64 md:shrink-0 md:py-4">
      <div className="h-full rounded-xl border bg-white shadow-sm dark:border-neutral-800 dark:bg-neutral-950">
        <CustomerSidebarContent
          user={user}
          pathname={pathname}
          onLogout={logout}
        />
      </div>
    </aside>
  );
}
