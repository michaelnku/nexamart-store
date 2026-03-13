import AdminUsersManagementPage from "@/app/marketplace/dashboard/admin/_components/AdminUsersManagementPage";

type Props = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

export default async function AdminSellersPage({ searchParams }: Props) {
  return (
    <AdminUsersManagementPage
      searchParams={await searchParams}
      config={{
        title: "Seller Management",
        description:
          "Monitor seller access, storefront readiness, and verification signals from the same shared admin user-management system.",
        emptyStateText:
          "No sellers match the current filters. Try a different search query or reset the current sort.",
        roleFilter: "SELLER",
      }}
    />
  );
}
