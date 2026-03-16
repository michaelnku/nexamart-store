import { UserRole } from "@/generated/prisma";

import AdminMarketingClient from "../_components/AdminMarketingClient";
import { createAnalyticsDateRange } from "@/lib/analytics/date-range";
import { CurrentUser } from "@/lib/currentUser";

export default async function AdminMarketingPage() {
  const user = await CurrentUser();

  if (!user || user.role !== UserRole.ADMIN) {
    return <p className="p-6">Unauthorized</p>;
  }

  return (
    <AdminMarketingClient initialRange={createAnalyticsDateRange("30d")} />
  );
}
