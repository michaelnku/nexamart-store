"use client";

import { Package, ShoppingBag, DollarSign, BarChart3 } from "lucide-react";

const SellerPage = () => {
  const stats = [
    {
      title: "Total Products",
      value: 42,
      icon: Package,
      color: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300",
    },
    {
      title: "Orders",
      value: 128,
      icon: ShoppingBag,
      color:
        "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300",
    },
    {
      title: "Revenue",
      value: "$8,540",
      icon: DollarSign,
      color:
        "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300",
    },
    {
      title: "Analytics",
      value: "View Report",
      icon: BarChart3,
      color:
        "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300",
    },
  ];

  return (
    <div className="">
      <h2 className="text-2xl font-bold mb-6 text-zinc-800 dark:text-zinc-100">
        Dashboard Overview
      </h2>

      {/* Stats cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <div
              key={stat.title}
              className={`p-6 rounded-2xl shadow-sm bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 flex items-center justify-between transition-all hover:scale-[1.02] ${stat.color}`}
            >
              <div>
                <h3 className="text-sm font-medium">{stat.title}</h3>
                <p className="text-xl font-bold mt-1">{stat.value}</p>
              </div>
              <Icon className="h-8 w-8 opacity-80" />
            </div>
          );
        })}
      </div>

      {/* Recent orders section */}
      <div className="mt-10 bg-white dark:bg-zinc-800 p-6 rounded-2xl shadow-sm border border-zinc-200 dark:border-zinc-700">
        <h3 className="text-lg font-semibold mb-4 text-zinc-800 dark:text-zinc-100">
          Recent Orders
        </h3>
        <p className="text-zinc-600 dark:text-zinc-400">
          This section will show your most recent orders once connected to the
          database.
        </p>
      </div>
    </div>
  );
};

export default SellerPage;
