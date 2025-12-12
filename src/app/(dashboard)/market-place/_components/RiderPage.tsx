"use client";

import { Package, CheckCircle, DollarSign, Clock } from "lucide-react";

const RiderPage = () => {
  const stats = [
    {
      title: "Active Deliveries",
      value: 5,
      icon: Package,
      color: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300",
    },
    {
      title: "Completed Today",
      value: 12,
      icon: CheckCircle,
      color:
        "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300",
    },
    {
      title: "Total Earnings",
      value: "₦14,800",
      icon: DollarSign,
      color:
        "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300",
    },
    {
      title: "Next Delivery",
      value: "12:45 PM",
      icon: Clock,
      color:
        "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300",
    },
  ];

  return (
    <div className="dark:bg-zinc-900">
      <main className="md:ml-62 py-12 p-2">
        {/* Header */}
        <header className="mb-8">
          <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-100 mb-2">
            Overview
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Welcome back! Track your active deliveries, daily performance, and
            earnings summary.
          </p>
        </header>

        {/* Stats Grid */}
        <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {stats.map((item) => {
            const Icon = item.icon;
            return (
              <div
                key={item.title}
                className={`p-6 rounded-2xl shadow-sm bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 flex items-center justify-between transition-all hover:scale-[1.02] ${item.color}`}
              >
                <div>
                  <h3 className="text-sm font-medium">{item.title}</h3>
                  <p className="text-xl font-bold mt-1">{item.value}</p>
                </div>
                <Icon className="h-8 w-8 opacity-80" />
              </div>
            );
          })}
        </section>

        {/* Recent Deliveries */}
        <section className="mt-10 bg-white dark:bg-zinc-800 p-6 rounded-2xl shadow-sm border border-zinc-200 dark:border-zinc-700">
          <h3 className="text-lg font-semibold mb-4 text-zinc-800 dark:text-zinc-100">
            Recent Deliveries
          </h3>

          <div className="space-y-3">
            <div className="flex justify-between items-center text-sm border-b border-zinc-200 dark:border-zinc-700 pb-2">
              <span className="font-medium text-zinc-700 dark:text-zinc-300">
                Order #1234
              </span>
              <span className="text-green-600 dark:text-green-400 font-semibold">
                Delivered
              </span>
              <span className="text-zinc-500 dark:text-zinc-400">₦2,400</span>
            </div>
            <div className="flex justify-between items-center text-sm border-b border-zinc-200 dark:border-zinc-700 pb-2">
              <span className="font-medium text-zinc-700 dark:text-zinc-300">
                Order #1228
              </span>
              <span className="text-yellow-600 dark:text-yellow-400 font-semibold">
                In Transit
              </span>
              <span className="text-zinc-500 dark:text-zinc-400">₦1,800</span>
            </div>
            <div className="flex justify-between items-center text-sm">
              <span className="font-medium text-zinc-700 dark:text-zinc-300">
                Order #1219
              </span>
              <span className="text-green-600 dark:text-green-400 font-semibold">
                Delivered
              </span>
              <span className="text-zinc-500 dark:text-zinc-400">₦2,000</span>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
};

export default RiderPage;
