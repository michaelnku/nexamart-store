"use client";

import { motion } from "framer-motion";
import { Package, Clock, Truck, CheckCircle2, XCircle } from "lucide-react";
import { cn } from "@/lib/utils";

const ORDER_STEPS = [
  "PENDING",
  "PROCESSING",
  "IN_TRANSIT",
  "DELIVERED",
] as const;

const STEP_CONFIG = {
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

type TimelineItem = {
  status: string;
  createdAt: string;
};

type Props = {
  status: string;
  timelines: TimelineItem[];
};

export default function OrderStepper({ status, timelines }: Props) {
  const isCancelled = status === "CANCELLED";

  const reachedStatuses = timelines.map((t) => t.status);

  const currentStepIndex = ORDER_STEPS.reduce((acc, step, index) => {
    return reachedStatuses.includes(step) ? index : acc;
  }, 0);

  return (
    <section className="border rounded-xl p-5 bg-white shadow-sm">
      <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
        <Clock className="w-5 h-5 text-[var(--brand-blue)]" />
        Order Progress
      </h2>

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
          const active = index === currentStepIndex;

          const timestamp = timelines.find(
            (t) => t.status === stepKey,
          )?.createdAt;

          return (
            <li key={stepKey} className="ml-5 space-y-1 relative">
              {/* DOT */}
              <motion.span
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 0.3 }}
                className={cn(
                  "absolute -left-[11px] flex h-6 w-6 items-center justify-center rounded-full border-2 text-xs font-semibold",
                  completed &&
                    "bg-[var(--brand-blue)] border-[var(--brand-blue)] text-white",
                  active &&
                    !completed &&
                    "bg-[#318bc4] border-[#318bc4] text-white",
                  !completed &&
                    !active &&
                    "bg-white border-gray-300 text-gray-400",
                )}
              >
                {completed ? "✓" : index + 1}
              </motion.span>

              {/* LABEL */}
              <div className="flex items-center gap-2">
                <Icon className="w-4 h-4 text-[var(--brand-blue)]" />
                <span className="text-sm font-medium">{step.label}</span>
              </div>

              {/* DESCRIPTION */}
              <p className="text-xs text-gray-500">{step.description}</p>

              {/* TIMESTAMP */}
              {timestamp && (
                <p className="text-[11px] text-gray-400">
                  {new Date(timestamp).toLocaleString("en-US", {
                    month: "short",
                    day: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </p>
              )}
            </li>
          );
        })}
      </ol>
    </section>
  );
}
