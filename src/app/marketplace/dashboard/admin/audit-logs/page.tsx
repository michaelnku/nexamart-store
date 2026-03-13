import AdminAuditLogsPage from "@/app/marketplace/dashboard/admin/_components/AdminAuditLogsPage";

type Props = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

export default async function AuditLogsRoutePage({ searchParams }: Props) {
  return <AdminAuditLogsPage searchParams={await searchParams} />;
}
