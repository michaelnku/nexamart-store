import { UserRole } from "@/generated/prisma";
import AdminEscrowPayoutControlClient from "../_components/AdminEscrowPayoutControlClient";
import { createAnalyticsDateRange } from "@/lib/analytics/date-range";
import { CurrentUser } from "@/lib/currentUser";

export default async function AdminEscrowPayoutControlPage() {
  const user = await CurrentUser();

  if (!user || user.role !== UserRole.ADMIN) {
    return <p className="p-6">Unauthorized</p>;
  }

  return (
    <AdminEscrowPayoutControlClient initialRange={createAnalyticsDateRange()} />
  );
}
