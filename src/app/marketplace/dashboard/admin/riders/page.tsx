import AdminUsersManagementPage from "@/app/marketplace/dashboard/admin/_components/AdminUsersManagementPage";

type Props = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

export default async function AdminRidersPage({ searchParams }: Props) {
  return (
    <AdminUsersManagementPage
      searchParams={await searchParams}
      config={{
        title: "Rider Management",
        description:
          "Keep delivery operations organized with one focused view for rider access, availability signals, and profile status.",
        emptyStateText:
          "No riders match the current filters. Adjust the query or sort options to find the right account.",
        roleFilter: "RIDER",
      }}
    />
  );
}
