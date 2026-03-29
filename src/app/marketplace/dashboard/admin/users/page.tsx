import AdminUsersManagementPage from "@/app/marketplace/dashboard/admin/_components/AdminUsersManagementPage";

export const dynamic = "force-dynamic";

type Props = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

export default async function AdminUsersPage({ searchParams }: Props) {
  return (
    <AdminUsersManagementPage
      searchParams={await searchParams}
      config={{
        title: "User Directory",
        description:
          "Review every marketplace account from one searchable control surface, with responsive management patterns that also power seller, rider, and moderator views.",
        emptyStateText:
          "No users match the current filters. Adjust the search or sorting controls to broaden the result set.",
        roleFilter: "ALL",
      }}
    />
  );
}
