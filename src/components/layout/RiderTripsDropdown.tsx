"use client";

import { getRiderDeliveriesAction } from "@/actions/rider/riderActions";
import { Spinner } from "@/components/ui/spinner";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";

type RiderTripsDropdownProps = {
  className: string;
  isActive: boolean;
  Icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
  label: string;
};

export default function RiderTripsDropdown({
  className,
  isActive,
  Icon,
  label,
}: RiderTripsDropdownProps) {
  const { data, isLoading, isError } = useQuery({
    queryKey: ["rider-deliveries", "assigned", "preview"],
    queryFn: async () => getRiderDeliveriesAction("assigned"),
    staleTime: 1000 * 20,
  });

  const isFailure = isError || !data || "error" in data;
  const deliveries = !isLoading && !isFailure ? data.deliveries : [];

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          className={`${className} ${isActive ? "text-[var(--brand-blue)]" : ""}`}
        >
          <Icon className="w-5 h-5" />
          <span className="text-[11px] hidden lg:block mt-[2px]">{label}</span>
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80 p-3">
        <div className="flex items-center justify-between mb-2">
          <p className="text-sm font-semibold">Assigned Trips</p>
          <Link
            href="/marketplace/dashboard/rider/trips"
            className="text-xs text-[var(--brand-blue)] hover:underline"
          >
            View all
          </Link>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-6">
            <Spinner />
          </div>
        ) : isFailure ? (
          <p className="text-sm text-red-600">Failed to load deliveries.</p>
        ) : deliveries.length === 0 ? (
          <p className="text-sm text-gray-500">No assigned deliveries yet.</p>
        ) : (
          <div className="space-y-2">
            {deliveries.slice(0, 5).map((delivery, index) => {
              const order = delivery.order;
              return (
                <Link
                  key={delivery.id}
                  href={`/marketplace/dashboard/rider/deliveries/${delivery.id}`}
                  className="block rounded-lg border p-3 hover:bg-gray-50 transition"
                >
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-semibold">
                      {order?.trackingNumber ?? order?.id}
                    </p>
                    {index === 0 ? (
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-[var(--brand-blue-light)] text-[var(--brand-blue)] font-semibold">
                        Latest
                      </span>
                    ) : null}
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    {order?.deliveryAddress ?? "No address"}
                  </p>
                </Link>
              );
            })}
          </div>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
