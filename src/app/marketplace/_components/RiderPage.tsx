"use client";

import { Package, CheckCircle, DollarSign, Clock } from "lucide-react";
import { useFormatMoneyFromUSD } from "@/hooks/useFormatMoneyFromUSD";

type RiderStats = {
  activeDeliveries: number;
  completedToday: number;
  totalEarnings: number;
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
  status.toLowerCase().replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());

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
      color: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300",
    },
    {
      title: "Completed Today",
      value: stats.completedToday,
      icon: CheckCircle,
      color:
        "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300",
    },
    {
      title: "Total Earnings",
      value: formatMoneyFromUSD(stats.totalEarnings),
      icon: DollarSign,
      color:
        "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300",
    },
    {
      title: "Next Delivery",
      value: nextDelivery,
      icon: Clock,
      color:
        "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300",
    },
  ];

  return (
    <div className="dark:bg-zinc-900">
      <main>
        <header className="mb-8">
          <h1 className="mb-2 text-2xl font-bold text-gray-800 dark:text-gray-100">
            Overview
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Welcome back! Track your active deliveries, daily performance, and
            earnings summary.
          </p>
        </header>

        <section className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {dashboardStats.map((item) => {
            const Icon = item.icon;
            return (
              <div
                key={item.title}
                className={`flex items-center justify-between rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm transition-all hover:scale-[1.02] dark:border-zinc-700 dark:bg-zinc-800 ${item.color}`}
              >
                <div>
                  <h3 className="text-sm font-medium">{item.title}</h3>
                  <p className="mt-1 text-xl font-bold">{item.value}</p>
                </div>
                <Icon className="h-8 w-8 opacity-80" />
              </div>
            );
          })}
        </section>

        <section className="mt-10 rounded-xl border bg-white p-5 shadow-sm dark:bg-neutral-950">
          <h3 className="mb-4 text-lg font-semibold">
            Latest Events
          </h3>

          {!stats.latestEvents.length ? (
            <p className="text-sm text-gray-500">No recent events yet.</p>
          ) : (
            <div className="space-y-3">
              {stats.latestEvents.map((event, index) => (
                <div
                  key={event.id}
                  className={`flex flex-col gap-2 rounded-lg py-2 sm:flex-row sm:items-center sm:justify-between ${
                    index !== stats.latestEvents.length - 1
                      ? "border-b border-zinc-200 dark:border-zinc-800"
                      : ""
                  }`}
                >
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                      {event.title}
                    </p>
                    <p className="text-xs text-gray-600 dark:text-zinc-400">
                      {event.description}
                    </p>
                    <p className="text-xs text-gray-500">
                      {formatDateTime(event.createdAt)} UTC
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center gap-2 sm:justify-end">
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
        </section>
      </main>
    </div>
  );
};

export default RiderPage;
