"use client";

import {
  Package,
  ShoppingBag,
  DollarSign,
  BarChart3,
  AlertTriangle,
} from "lucide-react";

export default function SellerPage() {
  const stats = [
    { title: "Active Products", value: 42, icon: Package },
    { title: "Total Orders", value: 128, icon: ShoppingBag },
    { title: "Total Revenue", value: "$8,540", icon: DollarSign },
    { title: "Performance", value: "View Report", icon: BarChart3 },
  ];

  return (
    <main className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Seller Dashboard</h1>
        <p className="text-sm text-gray-500">
          Welcome back — monitor sales and manage your store
        </p>
      </div>

      <div className="p-4 bg-yellow-50 border rounded-xl flex items-center gap-3">
        <AlertTriangle className="w-5 h-5 text-yellow-700" />
        <p className="text-sm text-yellow-800">
          Action required: Please update inventory for 6 low–stock products.
        </p>
      </div>

      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <div
              key={stat.title}
              className="p-5 bg-white border rounded-xl shadow-sm hover:shadow-md transition-all"
            >
              <div className="flex justify-between items-center">
                <div>
                  <p className="text-sm text-gray-500">{stat.title}</p>
                  <p className="text-2xl font-semibold mt-1">{stat.value}</p>
                </div>
                <Icon className="w-8 h-8 text-gray-600" />
              </div>
            </div>
          );
        })}
      </section>

      <section className="bg-white border rounded-xl p-6 shadow-sm space-y-2">
        <h2 className="text-lg font-semibold">Recent Orders</h2>
        <p className="text-sm text-gray-500">
          Your 5 most recent orders will appear here.
        </p>
      </section>
    </main>
  );
}
