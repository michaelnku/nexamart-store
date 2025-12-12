"use client";

import { Users, Package, DollarSign, AlertTriangle } from "lucide-react";

const AdminPage = () => {
  const stats = [
    {
      title: "Total Users",
      value: 1240,
      icon: Users,
      color: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300",
    },
    {
      title: "Total Products",
      value: 860,
      icon: Package,
      color:
        "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300",
    },
    {
      title: "Total Revenue",
      value: "₦452,000",
      icon: DollarSign,
      color:
        "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300",
    },
    {
      title: "Pending Reports",
      value: 14,
      icon: AlertTriangle,
      color: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300",
    },
  ];

  return (
    <div className="bg-gray-50 dark:bg-zinc-900 px-6 py-4">
      {/* Header */}
      <header className="mb-8">
        <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-100 mb-2">
          Admin Panel
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Welcome back, Admin! Monitor platform performance, manage users, and
          track activities.
        </p>
      </header>

      {/* Stats Cards */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
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
      </section>

      {/* Recent Activity */}
      <section className="mt-10 bg-white dark:bg-zinc-800 p-6 rounded-2xl shadow-sm border border-zinc-200 dark:border-zinc-700">
        <h3 className="text-lg font-semibold mb-4 text-zinc-800 dark:text-zinc-100">
          Recent Activities
        </h3>

        <div className="space-y-3">
          <div className="flex justify-between items-center text-sm border-b border-zinc-200 dark:border-zinc-700 pb-2">
            <span className="font-medium text-zinc-700 dark:text-zinc-300">
              New user registered: <strong>john_doe</strong>
            </span>
            <span className="text-zinc-500 dark:text-zinc-400">5 mins ago</span>
          </div>
          <div className="flex justify-between items-center text-sm border-b border-zinc-200 dark:border-zinc-700 pb-2">
            <span className="font-medium text-zinc-700 dark:text-zinc-300">
              Product <strong>“Nike Air Max”</strong> added by Seller #204
            </span>
            <span className="text-zinc-500 dark:text-zinc-400">
              30 mins ago
            </span>
          </div>
          <div className="flex justify-between items-center text-sm">
            <span className="font-medium text-zinc-700 dark:text-zinc-300">
              Report received for <strong>fake profile</strong>
            </span>
            <span className="text-zinc-500 dark:text-zinc-400">1 hour ago</span>
          </div>
        </div>
      </section>
    </div>
  );
};

export default AdminPage;
