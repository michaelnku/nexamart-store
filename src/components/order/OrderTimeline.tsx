"use client";

import {
  CheckCircle,
  CheckCircle2,
  Clock,
  Package,
  Truck,
  XCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { OrderStatus } from "@/generated/prisma/client";
import { OrderTrackDTO } from "@/lib/types";

type TimelineItem = {
  id: string;
  status: OrderStatus;
  message?: string | null;
  createdAt: string;
};

const ORDER_STEPS = [
  "PENDING",
  "PROCESSING",
  "IN_TRANSIT",
  "DELIVERED",
] as const;

const STEP_CONFIG: Record<
  (typeof ORDER_STEPS)[number],
  {
    label: string;
    description: string;
    icon: React.ElementType;
  }
> = {
  PENDING: {
    label: "Order Placed",
    description: "We've received your order",
    icon: Package,
  },
  PROCESSING: {
    label: "Processing",
    description: "Seller is preparing your order",
    icon: Clock,
  },
  IN_TRANSIT: {
    label: "On the Way",
    description: "Your order is on the way",
    icon: Truck,
  },
  DELIVERED: {
    label: "Delivered",
    description: "Order completed successfully",
    icon: CheckCircle2,
  },
};

type Props = {
  order: OrderTrackDTO;
  timeline: TimelineItem[];
};

export default function OrderTimeline({ order, timeline }: Props) {
  const isCancelled = order.status === "CANCELLED";
  const formatTimelineDate = (value: string) =>
    new Date(value).toLocaleString("en-US", {
      timeZone: "UTC",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });

  /**
   * Latest known status (timeline is the source of truth)
   */
  const latestStatus: OrderStatus =
    timeline.length > 0 ? timeline[timeline.length - 1].status : order.status;

  /**
   * Determine active step index
   */
  const currentStepIndex = ORDER_STEPS.indexOf(
    latestStatus as (typeof ORDER_STEPS)[number],
  );

  return (
    <>
      {/* ================= STEPPER ================= */}
      <section className="border rounded-xl p-5 bg-white dark:bg-background shadow-sm">
        <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <Clock className="w-5 h-5 text-[var(--brand-blue)]" />
          Order Progress
        </h2>

        {/* CANCELLED STATE */}
        {isCancelled && (
          <div className="mb-4 flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
            <XCircle className="w-4 h-4" />
            This order was cancelled.
          </div>
        )}

        <ol className="relative ml-4 border-l border-gray-200 space-y-6">
          {ORDER_STEPS.map((stepKey, index) => {
            const step = STEP_CONFIG[stepKey];
            const Icon = step.icon;

            const completed = index < currentStepIndex;
            const active = index === currentStepIndex && !isCancelled;

            return (
              <li key={stepKey} className="ml-5 space-y-1">
                {/* STEP DOT */}
                <span
                  className={cn(
                    "absolute -left-[11px] flex h-6 w-6 items-center justify-center rounded-full border-2 text-xs font-semibold transition",
                    completed &&
                      "bg-[var(--brand-blue)] dark:bg-background border-[var(--brand-blue)] text-white",
                    active &&
                      "bg-[#318bc4] dark:bg-background border-[#318bc4] text-white",
                    !completed &&
                      !active &&
                      "bg-white dark:bg-background border-gray-300 text-gray-400",
                  )}
                >
                  {completed ? "✓" : index + 1}
                </span>

                {/* LABEL */}
                <div className="flex items-center gap-2">
                  <Icon
                    className={cn(
                      "w-4 h-4",
                      completed || active
                        ? "text-[var(--brand-blue)]"
                        : "text-gray-400",
                    )}
                  />
                  <span
                    className={cn(
                      "text-sm font-medium",
                      completed || active
                        ? "text-gray-900 dark:text-gray-400"
                        : "text-gray-500 dark:text-gray-400",
                    )}
                  >
                    {step.label}
                  </span>
                </div>

                {/* DESCRIPTION */}
                <p className="text-xs text-gray-500">{step.description}</p>
              </li>
            );
          })}
        </ol>
      </section>

      {/* ================= TIMELINE ================= */}
      <section className="border rounded-xl bg-white dark:bg-background p-6 space-y-5">
        <h3 className="font-semibold text-lg">Order Status</h3>

        <ol className="space-y-6">
          {timeline.map((item, index) => {
            const isLatest = index === timeline.length - 1;

            return (
              <li key={item.id} className="flex gap-4">
                {/* ICON */}
                <div className="flex flex-col items-center">
                  <div
                    className={cn(
                      "h-8 w-8 rounded-full flex items-center justify-center",
                      isLatest
                        ? "bg-[var(--brand-blue)] dark:bg-background text-white"
                        : "bg-gray-200 dark:bg-background text-gray-600",
                    )}
                  >
                    {isLatest ? (
                      <CheckCircle className="h-4 w-4" />
                    ) : (
                      <Clock className="h-4 w-4" />
                    )}
                  </div>

                  {!isLatest && (
                    <div className="w-px h-full bg-gray-200 mt-1" />
                  )}
                </div>

                {/* CONTENT */}
                <div className="flex-1">
                  <p className="font-medium ">
                    {item.status.replaceAll("_", " ")}
                  </p>

                  {item.message && (
                    <p className="text-sm text-gray-600">{item.message}</p>
                  )}

                  <p className="text-xs text-gray-400 mt-1">
                    {formatTimelineDate(item.createdAt)}
                  </p>
                </div>
              </li>
            );
          })}
        </ol>
      </section>
    </>
  );
}
