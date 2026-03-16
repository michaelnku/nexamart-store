import { CurrentUser } from "@/lib/currentUser";
import { createAnalyticsDateRange } from "@/lib/analytics/date-range";
import AdminPlatformAnalyticsClient from "../_components/AdminPlatformAnalyticsClient";

export default async function AdminAnalyticsPage() {
  const user = await CurrentUser();

  if (!user || user.role !== "ADMIN") {
    return <p className="p-6">Unauthorized</p>;
  }

  return (
    <AdminPlatformAnalyticsClient initialRange={createAnalyticsDateRange()} />
  );
}
