import { Layers3, Search, Users } from "lucide-react";
import { redirect } from "next/navigation";

import AdminUsersClient from "@/app/marketplace/dashboard/admin/_components/AdminUsersClient";
import {
  DashboardHero,
  PremiumPanel,
  PremiumStatCard,
} from "@/app/marketplace/_components/PremiumDashboard";
import { getAdminUsers } from "@/lib/admin/user-management";
import {
  ADMIN_ROLE_FILTER_LABELS,
  parseAdminUsersSearchParams,
  type AdminUsersPageConfig,
} from "@/lib/admin/user-management.shared";
import { CurrentUser } from "@/lib/currentUser";

type Props = {
  config: AdminUsersPageConfig;
  searchParams?: Record<string, string | string[] | undefined>;
};

export default async function AdminUsersManagementPage({
  config,
  searchParams,
}: Props) {
  const currentUser = await CurrentUser();

  if (!currentUser) {
    redirect("/auth/login");
  }

  if (currentUser.role !== "ADMIN") {
    redirect("/403");
  }

  const parsedSearchParams = parseAdminUsersSearchParams(searchParams);
  const data = await getAdminUsers({
    page: parsedSearchParams.page,
    query: parsedSearchParams.query,
    sort: parsedSearchParams.sort,
    roleFilter: config.roleFilter,
  });

  return (
    <main className="mx-auto max-w-7xl space-y-8 px-4 py-6">
      <DashboardHero
        eyebrow="Admin User Management"
        title={config.title}
        description={
          config.description ||
          "Manage marketplace access, review account signals, and keep role-based operations organized from one reusable admin control surface."
        }
        accentClassName="bg-[linear-gradient(135deg,#0f172a_0%,#1e3a8a_44%,#0f766e_100%)]"
      />

      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <PremiumStatCard
          title="Matching Accounts"
          value={data.pagination.totalItems}
          description="Users matching the current route scope and filters."
          icon={Users}
          tintClassName="border-sky-200 bg-sky-50 text-sky-700 dark:border-sky-900/60 dark:bg-sky-950/40 dark:text-sky-300"
        />
        <PremiumStatCard
          title="Route Scope"
          value={ADMIN_ROLE_FILTER_LABELS[config.roleFilter]}
          description="Role-scoped view powered by the shared admin module."
          icon={Layers3}
          tintClassName="border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900/60 dark:bg-emerald-950/40 dark:text-emerald-300"
        />
        <PremiumStatCard
          title="Current Page"
          value={`${data.pagination.page}/${data.pagination.totalPages}`}
          description={
            data.filters.query
              ? `Search active: ${data.filters.query}`
              : "Search and sorting stay centralized across all routes."
          }
          icon={Search}
          tintClassName="border-violet-200 bg-violet-50 text-violet-700 dark:border-violet-900/60 dark:bg-violet-950/40 dark:text-violet-300"
        />
      </section>

      <PremiumPanel
        title={config.title}
        description="Manage marketplace access, review account signals, and keep role-based operations organized from one control surface."
      >
        <AdminUsersClient
          config={config}
          data={data}
          currentAdminId={currentUser.id}
        />
      </PremiumPanel>
    </main>
  );
}
