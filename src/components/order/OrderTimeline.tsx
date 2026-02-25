"use client";

import type { ElementType } from "react";
import {
  CheckCircle,
  CheckCircle2,
  Clock,
  Package,
  Truck,
  XCircle,
} from "lucide-react";
import { OrderStatus as DbOrderStatus } from "@/generated/prisma/client";
import { cn } from "@/lib/utils";
import { normalizeOrderStatus } from "@/lib/order/orderLifecycle";
import { getOrderStatusLabel } from "@/lib/order/statusLabel";
import { OrderStatus as ClientOrderStatus, OrderTrackDTO } from "@/lib/types";

type TimelineItem = {
  id: string;
  status: ClientOrderStatus;
  message?: string | null;
  createdAt: string;
};

const NON_FOOD_ORDER_STEPS = [
  "PENDING_PAYMENT",
  "PAID",
  "ACCEPTED",
  "READY",
  "IN_DELIVERY",
  "DELIVERED",
  "COMPLETED",
] as const satisfies readonly DbOrderStatus[];

const FOOD_ORDER_STEPS = [
  "PENDING_PAYMENT",
  "PAID",
  "ACCEPTED",
  "PREPARING",
  "READY",
  "IN_DELIVERY",
  "DELIVERED",
  "COMPLETED",
] as const satisfies readonly DbOrderStatus[];

type StepStatus =
  | (typeof NON_FOOD_ORDER_STEPS)[number]
  | (typeof FOOD_ORDER_STEPS)[number];

const STEP_CONFIG: Record<
  StepStatus,
  {
    label: string;
    description: string;
    icon: ElementType;
  }
> = {
  PENDING_PAYMENT: {
    label: "Order Placed",
    description: "We have received your order.",
    icon: Package,
  },
  PAID: {
    label: "Paid",
    description: "Payment confirmed.",
    icon: CheckCircle2,
  },
  ACCEPTED: {
    label: "Accepted",
    description: "Seller accepted your order.",
    icon: Clock,
  },
  PREPARING: {
    label: "Preparing",
    description: "Your food is being prepared.",
    icon: Clock,
  },
  READY: {
    label: "Ready for Pickup",
    description: "Order is ready and waiting for rider pickup.",
    icon: Truck,
  },
  IN_DELIVERY: {
    label: "In Transit",
    description: "Rider is on the way with your order.",
    icon: Truck,
  },
  DELIVERED: {
    label: "Delivered",
    description: "Order delivered successfully.",
    icon: CheckCircle2,
  },
  COMPLETED: {
    label: "Completed",
    description: "Order completed.",
    icon: CheckCircle2,
  },
};

type Props = {
  order: OrderTrackDTO;
  timeline: TimelineItem[];
};

export default function OrderTimeline({ order, timeline }: Props) {
  const normalizedOrderStatus = normalizeOrderStatus(order.status);
  const isCancelled = normalizedOrderStatus === "CANCELLED";
  const isFoodOrder = Boolean(order.isFoodOrder);
  const orderSteps = isFoodOrder ? FOOD_ORDER_STEPS : NON_FOOD_ORDER_STEPS;

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

  const reachedStatuses = new Set<DbOrderStatus>(
    timeline.map((item) => normalizeOrderStatus(item.status)),
  );
  reachedStatuses.add(normalizedOrderStatus);

  const latestStatus: DbOrderStatus =
    timeline.length > 0
      ? normalizeOrderStatus(timeline[timeline.length - 1].status)
      : normalizedOrderStatus;

  return (
    <>
      <section className="rounded-xl border border-border bg-card p-5 shadow-sm">
        <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold text-foreground">
          <Clock className="w-5 h-5 text-[var(--brand-blue)]" />
          Order Progress
        </h2>

        {isCancelled && (
          <div className="mb-4 flex items-center gap-2 rounded-lg border border-red-300 bg-red-50 p-3 text-sm text-red-700 dark:border-red-900/60 dark:bg-red-950/40 dark:text-red-200">
            <XCircle className="w-4 h-4" />
            This order was cancelled.
          </div>
        )}

        <ol className="relative ml-4 space-y-6 border-l border-border">
          {orderSteps.map((stepKey, index) => {
            const step = STEP_CONFIG[stepKey];
            const Icon = step.icon;
            const completed = reachedStatuses.has(stepKey);
            const active =
              !isCancelled &&
              latestStatus === stepKey &&
              reachedStatuses.has(stepKey);

            return (
              <li key={stepKey} className="ml-5 space-y-1">
                <span
                  className={cn(
                    "absolute -left-[11px] flex h-6 w-6 items-center justify-center rounded-full border-2 text-xs font-semibold transition",
                    completed &&
                      "border-[var(--brand-blue)] bg-[var(--brand-blue)] text-white",
                    active &&
                      "border-[#318bc4] bg-[#318bc4] text-white",
                    !completed &&
                      !active &&
                      "border-border bg-background text-muted-foreground",
                  )}
                >
                  {completed ? "OK" : index + 1}
                </span>

                <div className="flex items-center gap-2">
                  <Icon
                    className={cn(
                      "w-4 h-4",
                      completed || active
                        ? "text-[var(--brand-blue)]"
                        : "text-muted-foreground",
                    )}
                  />
                  <span
                    className={cn(
                      "text-sm font-medium",
                      completed || active
                        ? "text-foreground"
                        : "text-muted-foreground",
                    )}
                  >
                    {step.label}
                  </span>
                </div>

                <p className="text-xs text-muted-foreground">
                  {step.description}
                </p>
              </li>
            );
          })}
        </ol>
      </section>

      <section className="space-y-5 rounded-xl border border-border bg-card p-6">
        <h3 className="text-lg font-semibold text-foreground">Order Status</h3>

        <ol className="space-y-6">
          {timeline.map((item, index) => {
            const isLatest = index === timeline.length - 1;

            return (
              <li key={item.id} className="flex gap-4">
                <div className="flex flex-col items-center">
                  <div
                    className={cn(
                      "flex h-8 w-8 items-center justify-center rounded-full border",
                      isLatest
                        ? "border-[var(--brand-blue)] bg-[var(--brand-blue)] text-white"
                        : "border-border bg-muted text-muted-foreground",
                    )}
                  >
                    {isLatest ? (
                      <CheckCircle className="h-4 w-4" />
                    ) : (
                      <Clock className="h-4 w-4" />
                    )}
                  </div>

                  {!isLatest && (
                    <div className="mt-1 h-full w-px bg-border" />
                  )}
                </div>

                <div className="flex-1">
                  <p className="font-medium text-foreground">
                    {getOrderStatusLabel(item.status)}
                  </p>

                  {item.message && (
                    <p className="text-sm text-muted-foreground">
                      {item.message}
                    </p>
                  )}

                  <p className="mt-1 text-xs text-muted-foreground">
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
