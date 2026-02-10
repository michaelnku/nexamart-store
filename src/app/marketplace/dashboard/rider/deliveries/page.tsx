import { CurrentUser } from "@/lib/currentUser";
import RiderDeliveriesClient from "./rider-deliveries-client";

export default async function RiderDeliveriesPage() {
  const user = await CurrentUser();

  if (!user || user.role !== "RIDER") {
    return (
      <p className="text-center text-red-600 py-40">Unauthorized access</p>
    );
  }

  return <RiderDeliveriesClient />;
}
