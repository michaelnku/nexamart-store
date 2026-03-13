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
    <main className="mx-auto max-w-5xl space-y-6 px-4 py-6 text-slate-950 dark:text-zinc-100">
      <div>
        <h1 className="text-2xl font-semibold">My Trips</h1>
        <p className="text-sm text-gray-500 dark:text-zinc-400">
          Your assigned deliveries ready for pickup.
        </p>
      </div>

      {deliveries.length === 0 ? (
        <div className="rounded-xl border p-8 text-center text-gray-500 shadow-sm dark:border-zinc-800 dark:bg-neutral-950 dark:text-zinc-400">
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
                className="block rounded-xl border p-5 shadow-sm transition hover:shadow-md dark:border-zinc-800 dark:bg-neutral-950"
              >
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                  <div>
                    <p className="text-sm text-gray-500 dark:text-zinc-400">Order</p>
                    <p className="font-semibold">
                      {order?.trackingNumber ?? order?.id}
                    </p>
                    <p className="text-xs text-gray-400 dark:text-zinc-500">
                      {order?.createdAt
                        ? new Date(order.createdAt).toDateString()
                        : "-"}
                    </p>
                  </div>

                  <div>
                    <p className="text-sm text-gray-500 dark:text-zinc-400">Customer</p>
                    <p className="font-medium">
                      {order?.customer?.name ?? "Unknown"}
                    </p>
                    <p className="text-xs text-gray-400 dark:text-zinc-500">
                      {order?.customer?.email ?? "-"}
                    </p>
                  </div>

                  <div>
                    <p className="text-sm text-gray-500 dark:text-zinc-400">Status</p>
                    <p className="font-medium">
                      {delivery.status
                        .replaceAll("_", " ")
                        .toLowerCase()
                        .replace(/\b\w/g, (c) => c.toUpperCase())}
                    </p>
                  </div>
                </div>

                <div className="mt-4 text-sm text-gray-600 dark:text-zinc-300">
                  <span className="font-medium text-gray-700 dark:text-zinc-200">Address:</span>{" "}
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

