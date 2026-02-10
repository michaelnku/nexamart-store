import Link from "next/link";
import { getRiderDeliveriesAction } from "@/actions/rider/riderActions";

export default async function RiderTripsPage() {
  const data = await getRiderDeliveriesAction("assigned");

  if ("error" in data) {
    return (
      <p className="text-center text-red-600 py-40">
        Failed to load deliveries
      </p>
    );
  }

  const { deliveries } = data;

  return (
    <main className="max-w-5xl mx-auto py-6 px-4 space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">My Trips</h1>
        <p className="text-sm text-gray-500">
          Your assigned deliveries ready for pickup.
        </p>
      </div>

      {deliveries.length === 0 ? (
        <div className="border dark:bg-neutral-950 rounded-xl shadow-sm p-8 text-center text-gray-500">
          No assigned deliveries yet.
        </div>
      ) : (
        <div className="space-y-4">
          {deliveries.map((delivery) => {
            const order = delivery.order;
            return (
              <Link
                key={delivery.id}
                href={`/marketplace/dashboard/rider/deliveries/${delivery.id}`}
                className="block border dark:bg-neutral-950 rounded-xl shadow-sm p-5 hover:shadow-md transition"
              >
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                  <div>
                    <p className="text-sm text-gray-500">Order</p>
                    <p className="font-semibold">
                      {order?.trackingNumber ?? order?.id}
                    </p>
                    <p className="text-xs text-gray-400">
                      {order?.createdAt
                        ? new Date(order.createdAt).toDateString()
                        : "-"}
                    </p>
                  </div>

                  <div>
                    <p className="text-sm text-gray-500">Customer</p>
                    <p className="font-medium">
                      {order?.customer?.name ?? "Unknown"}
                    </p>
                    <p className="text-xs text-gray-400">
                      {order?.customer?.email ?? "-"}
                    </p>
                  </div>

                  <div>
                    <p className="text-sm text-gray-500">Status</p>
                    <p className="font-medium">
                      {delivery.status
                        .replace("_", " ")
                        .toLowerCase()
                        .replace(/\b\w/g, (c) => c.toUpperCase())}
                    </p>
                  </div>
                </div>

                <div className="mt-4 text-sm text-gray-600">
                  <span className="font-medium text-gray-700">Address:</span>{" "}
                  {order?.deliveryAddress ?? "-"}
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </main>
  );
}
