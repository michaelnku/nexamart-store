import { UserRole } from "@/generated/prisma";

import { createAnalyticsDateRange } from "@/lib/analytics/date-range";
import { CurrentUser } from "@/lib/currentUser";
import AdminJobsClient from "../_components/AdminJobsClient";

export default async function AdminJobsPage() {
  const user = await CurrentUser();

  if (!user || user.role !== UserRole.ADMIN) {
    return <p className="p-6">Unauthorized</p>;
  }

  return <AdminJobsClient initialRange={createAnalyticsDateRange("30d")} />;
}
