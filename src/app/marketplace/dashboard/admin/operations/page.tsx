import AdminOperationsAnalyticsClient from "../_components/AdminOperationsAnalyticsClient";
import { createAnalyticsDateRange } from "@/lib/analytics/date-range";
import { CurrentUser } from "@/lib/currentUser";

export default async function AdminOperationsAnalyticsPage() {
  const user = await CurrentUser();

  if (!user || user.role !== "ADMIN") {
    return <p className="p-6">Unauthorized</p>;
  }

  return (
    <AdminOperationsAnalyticsClient
      initialRange={createAnalyticsDateRange()}
    />
  );
}
