import { CurrentUser } from "@/lib/currentUser";
import { redirect } from "next/navigation";
import RiderDeliveriesClient from "./rider-deliveries-client";

type Props = {
  searchParams?: Promise<{
    status?: string;
  }>;
};

export default async function RiderDeliveriesPage({ searchParams }: Props) {
  const params = await searchParams;
  const user = await CurrentUser();

  if (!user || user.role !== "RIDER") {
    return (
      <p className="text-center text-red-600 py-40">Unauthorized access</p>
    );
  }

  if (!params?.status) {
    redirect("/marketplace/dashboard/rider/deliveries?status=pending");
  }

  return <RiderDeliveriesClient />;
}
