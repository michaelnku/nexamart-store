"use client";

import {
  ShoppingBag,
  Heart,
  CreditCard,
  Star,
  ShoppingCart,
} from "lucide-react";

const BuyerPage = () => {
  const stats = [
    {
      title: "Total Orders",
      value: 12,
      icon: ShoppingBag,
      color: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300",
    },
    {
      title: "Wishlist Items",
      value: 8,
      icon: Heart,
      color: "bg-pink-100 text-pink-700 dark:bg-pink-900/30 dark:text-pink-300",
    },
    {
      title: "Total Spent",
      value: "₦245,000",
      icon: CreditCard,
      color:
        "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300",
    },
    {
      title: "Average Rating",
      value: "4.8",
      icon: Star,
      color:
        "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300",
    },
  ];

  const recentOrders = [
    {
      id: "#ORD-2025-0032",
      item: "Adidas Ultraboost",
      price: "₦38,000",
      date: "2 days ago",
      status: "Delivered",
    },
    {
      id: "#ORD-2025-0029",
      item: "iPhone 13 Case",
      price: "₦9,500",
      date: "5 days ago",
      status: "Shipped",
    },
    {
      id: "#ORD-2025-0025",
      item: "Nike Hoodie",
      price: "₦22,000",
      date: "1 week ago",
      status: "Delivered",
    },
  ];

  const wishlist = [
    { name: "Apple Watch Series 9", price: "₦450,000" },
    { name: "Zara Denim Jacket", price: "₦35,000" },
  ];

  const cartItems = [
    {
      name: "Samsung Galaxy Buds 2",
      quantity: 1,
      price: "₦85,000",
    },
    {
      name: "Levi’s Slim Fit Jeans",
      quantity: 2,
      price: "₦48,000",
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-zinc-900 p-6">
      {/* Header */}
      <header className="mb-8">
        <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-100 mb-2">
          Dashboard Overview
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Welcome back! Track your orders, wishlist, cart, and spending summary.
        </p>
      </header>

      {/* Stats */}
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

      {/* Recent Orders */}
      <section className="mt-10 bg-white dark:bg-zinc-800 p-6 rounded-2xl shadow-sm border border-zinc-200 dark:border-zinc-700">
        <h3 className="text-lg font-semibold mb-4 text-zinc-800 dark:text-zinc-100">
          Recent Orders
        </h3>

        <div className="divide-y divide-zinc-200 dark:divide-zinc-700">
          {recentOrders.map((order) => (
            <div
              key={order.id}
              className="flex justify-between items-center py-3 text-sm"
            >
              <div>
                <p className="font-medium text-zinc-800 dark:text-zinc-200">
                  {order.item}
                </p>
                <p className="text-zinc-500 dark:text-zinc-400">
                  {order.id} • {order.date}
                </p>
              </div>
              <div className="text-right">
                <p className="font-semibold text-zinc-800 dark:text-zinc-100">
                  {order.price}
                </p>
                <span
                  className={`text-xs font-medium px-3 py-1 rounded-full ${
                    order.status === "Delivered"
                      ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300"
                      : "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300"
                  }`}
                >
                  {order.status}
                </span>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Wishlist Preview */}
      <section className="mt-10 bg-white dark:bg-zinc-800 p-6 rounded-2xl shadow-sm border border-zinc-200 dark:border-zinc-700">
        <h3 className="text-lg font-semibold mb-4 text-zinc-800 dark:text-zinc-100 flex items-center gap-2">
          <Heart className="h-5 w-5 text-pink-500" />
          Wishlist Preview
        </h3>
        <div className="space-y-3">
          {wishlist.map((item) => (
            <div
              key={item.name}
              className="flex justify-between items-center text-sm"
            >
              <p className="text-zinc-700 dark:text-zinc-300">{item.name}</p>
              <span className="font-medium text-zinc-800 dark:text-zinc-100">
                {item.price}
              </span>
            </div>
          ))}
        </div>
      </section>

      {/* Cart Items */}
      <section className="mt-10 bg-white dark:bg-zinc-800 p-6 rounded-2xl shadow-sm border border-zinc-200 dark:border-zinc-700">
        <h3 className="text-lg font-semibold mb-4 text-zinc-800 dark:text-zinc-100 flex items-center gap-2">
          <ShoppingCart className="h-5 w-5 text-blue-500" />
          Cart Items
        </h3>
        <div className="space-y-3">
          {cartItems.map((item) => (
            <div
              key={item.name}
              className="flex justify-between items-center text-sm"
            >
              <div>
                <p className="text-zinc-700 dark:text-zinc-300">{item.name}</p>
                <p className="text-xs text-zinc-500 dark:text-zinc-400">
                  Quantity: {item.quantity}
                </p>
              </div>
              <span className="font-medium text-zinc-800 dark:text-zinc-100">
                {item.price}
              </span>
            </div>
          ))}
        </div>

        <div className="mt-4 text-right">
          <p className="text-sm text-zinc-600 dark:text-zinc-400">
            Total:{" "}
            <span className="font-semibold text-zinc-900 dark:text-zinc-100">
              ₦181,000
            </span>
          </p>
        </div>
      </section>
    </div>
  );
};

export default BuyerPage;
