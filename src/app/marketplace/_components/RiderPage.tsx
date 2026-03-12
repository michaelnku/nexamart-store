"use client";

import Link from "next/link";
import {
  AlertTriangle,
  CheckCircle,
  Clock,
  DollarSign,
  Package,
} from "lucide-react";

import { useFormatMoneyFromUSD } from "@/hooks/useFormatMoneyFromUSD";
import {
  DashboardHero,
  PremiumNotice,
  PremiumPanel,
  PremiumStatCard,
} from "./PremiumDashboard";

type RiderStats = {
  activeDeliveries: number;
  completedToday: number;
  totalEarnings: number;
  isRiderVerified: boolean;
  isRiderAvailable: boolean;
  assignedPendingAcceptCount: number;
  pendingPayouts: number;
  nextDeliveryAt: string | null;
  latestEvents: {
    id: string;
    type: "DELIVERY" | "EARNING" | "WITHDRAWAL";
    title: string;
    description: string;
    status: string;
    amount: number;
    createdAt: string;
  }[];
};

const formatDeliveryStatus = (status: string) =>
  status
    .toLowerCase()
    .replace(/_/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());

const RiderPage = ({ stats }: { stats: RiderStats }) => {
  const formatMoneyFromUSD = useFormatMoneyFromUSD();
  const formatDateTime = (value: string) =>
    new Intl.DateTimeFormat("en-US", {
      timeZone: "UTC",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: true,
    }).format(new Date(value));
  const formatTime = (value: string) =>
    new Intl.DateTimeFormat("en-US", {
      timeZone: "UTC",
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    }).format(new Date(value));

  const nextDelivery = stats.nextDeliveryAt
    ? `${formatTime(stats.nextDeliveryAt)} UTC`
    : "No active delivery";

  const dashboardStats = [
    {
      title: "Active Deliveries",
      value: stats.activeDeliveries,
      icon: Package,
      description: "Assignments that still need pickup or completion.",
      tintClassName:
        "border-sky-200 bg-sky-50 text-sky-700 dark:border-sky-900/60 dark:bg-sky-950/40 dark:text-sky-300",
    },
    {
      title: "Completed Today",
      value: stats.completedToday,
      icon: CheckCircle,
      description: "Deliveries successfully closed out today.",
      tintClassName:
        "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900/60 dark:bg-emerald-950/40 dark:text-emerald-300",
    },
    {
      title: "Total Earnings",
      value: formatMoneyFromUSD(stats.totalEarnings),
      icon: DollarSign,
      description: "Lifetime rider earnings recorded across deliveries.",
      tintClassName:
        "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-900/60 dark:bg-amber-950/40 dark:text-amber-300",
    },
    {
      title: "Next Delivery",
      value: nextDelivery,
      icon: Clock,
      description: "Your next scheduled delivery checkpoint in UTC.",
      tintClassName:
        "border-violet-200 bg-violet-50 text-violet-700 dark:border-violet-900/60 dark:bg-violet-950/40 dark:text-violet-300",
    },
  ];

  return (
    <main className="mx-auto max-w-7xl space-y-8 px-4 py-6">
      <DashboardHero
        eyebrow="Rider Dashboard"
        title="Overview"
        description="Track active deliveries, daily performance, and payout momentum from the same premium dashboard system used across the marketplace."
        accentClassName="bg-[linear-gradient(135deg,#0f172a_0%,#0f4c81_48%,#0f766e_100%)]"
      />

      {!stats.isRiderVerified && (
        <PremiumNotice
          icon={AlertTriangle}
          title="Verification Pending"
          description="Your rider profile is not verified yet, so some operational features remain limited."
          toneClassName="border-yellow-200 bg-yellow-50 text-yellow-900 dark:border-yellow-900/60 dark:bg-yellow-950/30 dark:text-yellow-100"
        />
      )}

      {!stats.isRiderAvailable && (
        <PremiumNotice
          icon={AlertTriangle}
          title="You Are Offline"
          description="Turn on availability to start receiving new delivery assignments from the operations queue."
          toneClassName="border-orange-200 bg-orange-50 text-orange-900 dark:border-orange-900/60 dark:bg-orange-950/30 dark:text-orange-100"
        />
      )}

      {stats.assignedPendingAcceptCount > 0 && (
        <PremiumNotice
          icon={AlertTriangle}
          title="Assignments Waiting"
          description={`You have ${stats.assignedPendingAcceptCount} assigned ${stats.assignedPendingAcceptCount === 1 ? "delivery" : "deliveries"} pending acceptance.`}
          toneClassName="border-rose-200 bg-rose-50 text-rose-900 dark:border-rose-900/60 dark:bg-rose-950/30 dark:text-rose-100"
        />
      )}

      {stats.pendingPayouts > 0 && (
        <PremiumNotice
          icon={AlertTriangle}
          title="Pending Payouts"
          description={`You have ${stats.pendingPayouts} pending payout${stats.pendingPayouts === 1 ? "" : "s"} awaiting processing.`}
          toneClassName="border-sky-200 bg-sky-50 text-sky-900 dark:border-sky-900/60 dark:bg-sky-950/30 dark:text-sky-100"
        />
      )}

      <section className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {dashboardStats.map((item) => (
          <PremiumStatCard
            key={item.title}
            title={item.title}
            value={item.value}
            description={item.description}
            icon={item.icon}
            tintClassName={item.tintClassName}
          />
        ))}
      </section>

      <PremiumPanel
        title="Latest Events"
        description="Recent delivery, earning, and withdrawal activity tied to your rider account."
      >
        {!stats.latestEvents.length ? (
          <p className="text-sm text-gray-500">No recent events yet.</p>
        ) : (
          <div className="space-y-3">
            {stats.latestEvents.map((event, index) => (
              <div
                key={event.id}
                className={`flex flex-col gap-3 rounded-lg py-2 sm:flex-row sm:items-center sm:justify-between ${
                  index !== stats.latestEvents.length - 1
                    ? "border-b border-zinc-200 dark:border-zinc-800"
                    : ""
                }`}
              >
                <div className="min-w-0 space-y-1">
                  <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                    {event.title}
                  </p>
                  <p className="text-xs leading-5 text-gray-600 dark:text-zinc-400">
                    {event.description}
                  </p>
                  <p className="text-xs text-gray-500">
                    {formatDateTime(event.createdAt)} UTC
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-2 sm:max-w-[45%] sm:justify-end">
                  <span className="rounded-full bg-zinc-100 px-2.5 py-1 text-xs font-medium text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300">
                    {event.type}
                  </span>
                  <span className="rounded-full bg-blue-50 px-2.5 py-1 text-xs font-medium text-blue-700 dark:bg-blue-900/30 dark:text-blue-300">
                    {formatDeliveryStatus(event.status)}
                  </span>
                  <span className="text-sm font-semibold text-zinc-800 dark:text-zinc-200">
                    {formatMoneyFromUSD(event.amount)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="mt-5">
          <Link
            href="/settings/rider/operations"
            className="text-sm font-medium text-sky-700 transition hover:text-sky-800 dark:text-sky-300 dark:hover:text-sky-200"
          >
            Manage rider operations
          </Link>
        </div>
      </PremiumPanel>
    </main>
  );
};

export default RiderPage;
