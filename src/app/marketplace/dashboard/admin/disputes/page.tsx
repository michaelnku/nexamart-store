import { UserRole } from "@/generated/prisma";

import AdminDisputesClient from "@/app/marketplace/dashboard/admin/disputes/AdminDisputesClient";
import { createAnalyticsDateRange } from "@/lib/analytics/date-range";
import { CurrentUser } from "@/lib/currentUser";

export default async function AdminDisputesPage() {
  const user = await CurrentUser();

  if (!user || user.role !== UserRole.ADMIN) {
    return <p className="p-6">Unauthorized</p>;
  }

  return (
    <AdminDisputesClient initialRange={createAnalyticsDateRange()} />
  );
}
