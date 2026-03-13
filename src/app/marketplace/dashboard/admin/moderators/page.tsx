import AdminUsersManagementPage from "@/app/marketplace/dashboard/admin/_components/AdminUsersManagementPage";

type Props = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

export default async function AdminModeratorsPage({ searchParams }: Props) {
  return (
    <AdminUsersManagementPage
      searchParams={await searchParams}
      config={{
        title: "Moderator Management",
        description:
          "Use the shared admin role-management surface to review moderator access, staff metadata, and role assignments.",
        emptyStateText:
          "No moderators match the current filters. Refine the search or sorting controls and try again.",
        roleFilter: "MODERATOR",
      }}
    />
  );
}
