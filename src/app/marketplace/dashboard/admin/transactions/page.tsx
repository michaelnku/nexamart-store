import { UserRole } from "@/generated/prisma";

import { createAnalyticsDateRange } from "@/lib/analytics/date-range";
import { CurrentUser } from "@/lib/currentUser";
import AdminTransactionsClient from "../_components/AdminTransactionsClient";

export default async function AdminTransactionsPage() {
  const user = await CurrentUser();

  if (!user || user.role !== UserRole.ADMIN) {
    return <p className="p-6">Unauthorized</p>;
  }

  return (
    <AdminTransactionsClient initialRange={createAnalyticsDateRange("30d")} />
  );
}
