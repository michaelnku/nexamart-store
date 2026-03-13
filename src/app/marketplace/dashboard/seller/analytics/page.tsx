"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Package,
  ShoppingBag,
  DollarSign,
  TrendingUp,
  TrendingDown,
} from "lucide-react";
import { useState } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  Legend,
} from "recharts";
import Image from "next/image";

const mockAnalyticsData = [
  { name: "Jan", sales: 120, revenue: 45000 },
  { name: "Feb", sales: 98, revenue: 38000 },
  { name: "Mar", sales: 86, revenue: 52000 },
  { name: "Apr", sales: 130, revenue: 60000 },
  { name: "May", sales: 95, revenue: 40000 },
  { name: "Jun", sales: 150, revenue: 67000 },
];

const topProducts = [
  {
    id: 1,
    name: "Nike Air Max 270",
    image: "/images/shoe-1.jpg",
    sold: 25,
    revenue: 1125000,
  },
  {
    id: 2,
    name: "Apple AirPods Pro",
    image: "/images/airpods.jpg",
    sold: 15,
    revenue: 1800000,
  },
  {
    id: 3,
    name: "Adidas Ultraboost",
    image: "/images/shoe-2.jpg",
    sold: 10,
    revenue: 750000,
  },
];

const performance = {
  products: { total: 0, growth: 5 },
  orders: { total: 0, growth: -8 },
  revenue: { total: 0, growth: 12 },
};

const SellerAnalyticsPage = () => {
  const [period, setPeriod] = useState("Monthly");

  const getTrendIcon = (growth: number) => {
    if (growth > 0)
      return <TrendingUp className="w-4 h-4 text-green-500 inline-block" />;
    if (growth < 0)
      return <TrendingDown className="w-4 h-4 text-red-500 inline-block" />;
    return null;
  };

  return (
    <main className="min-h-screen space-y-8 bg-gray-50 px-4 py-6 text-slate-950 dark:bg-zinc-950 dark:text-zinc-100">
      <h1 className="text-2xl font-semibold">Analytics</h1>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="border border-gray-200 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
          <CardHeader className="flex items-center gap-2">
            <Package className="h-5 w-5 text-gray-500 dark:text-zinc-400" />
            <CardTitle className="text-sm font-medium text-slate-700 dark:text-zinc-300">
              Products
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold text-slate-950 dark:text-zinc-100">
              {performance.products.total}
            </p>
            <p className="flex items-center gap-1 text-sm text-gray-500 dark:text-zinc-400">
              {getTrendIcon(performance.products.growth)}
              {performance.products.growth > 0
                ? `+${performance.products.growth}%`
                : `${performance.products.growth}%`}{" "}
              vs last month
            </p>
          </CardContent>
        </Card>

        <Card className="border border-gray-200 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
          <CardHeader className="flex items-center gap-2">
            <ShoppingBag className="h-5 w-5 text-gray-500 dark:text-zinc-400" />
            <CardTitle className="text-sm font-medium text-slate-700 dark:text-zinc-300">
              Orders
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold text-slate-950 dark:text-zinc-100">
              {performance.orders.total}
            </p>
            <p className="flex items-center gap-1 text-sm text-gray-500 dark:text-zinc-400">
              {getTrendIcon(performance.orders.growth)}
              {performance.orders.growth > 0
                ? `+${performance.orders.growth}%`
                : `${performance.orders.growth}%`}{" "}
              vs last month
            </p>
          </CardContent>
        </Card>

        <Card className="border border-gray-200 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
          <CardHeader className="flex items-center gap-2">
            <DollarSign className="h-5 w-5 text-gray-500 dark:text-zinc-400" />
            <CardTitle className="text-sm font-medium text-slate-700 dark:text-zinc-300">
              Revenue
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold text-slate-950 dark:text-zinc-100">
              ₦{performance.revenue.total.toLocaleString()}
            </p>
            <p className="flex items-center gap-1 text-sm text-gray-500 dark:text-zinc-400">
              {getTrendIcon(performance.revenue.growth)}
              {performance.revenue.growth > 0
                ? `+${performance.revenue.growth}%`
                : `${performance.revenue.growth}%`}{" "}
              vs last month
            </p>
          </CardContent>
        </Card>

        <Card className="border border-gray-200 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
          <CardHeader className="flex items-center justify-between">
            <CardTitle className="text-sm font-medium text-slate-700 dark:text-zinc-300">
              Sales Trend
            </CardTitle>
          </CardHeader>
          <CardContent>
            <select
              className="w-full rounded-md border border-gray-300 bg-white px-2 py-1 text-sm text-slate-700 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-200"
              value={period}
              onChange={(e) => setPeriod(e.target.value)}
            >
              <option>Daily</option>
              <option>Weekly</option>
              <option>Monthly</option>
            </select>
          </CardContent>
        </Card>
      </div>

      {/* Line Chart */}
      <Card className="border border-gray-200 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
        <CardHeader>
          <CardTitle className="font-medium text-gray-800 dark:text-zinc-100">
            Revenue & Sales Trend
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={350}>
            <LineChart data={mockAnalyticsData}>
              <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
              <XAxis dataKey="name" stroke="#6b7280" />
              <YAxis stroke="#6b7280" />
              <Tooltip />
              <Legend />
              <defs>
                <linearGradient id="revenueLine" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#10b981" stopOpacity={0.8} />
                  <stop offset="100%" stopColor="#10b981" stopOpacity={0.1} />
                </linearGradient>
                <linearGradient id="salesLine" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#3b82f6" stopOpacity={0.8} />
                  <stop offset="100%" stopColor="#3b82f6" stopOpacity={0.1} />
                </linearGradient>
              </defs>
              <Line
                type="monotone"
                dataKey="revenue"
                stroke="url(#revenueLine)"
                strokeWidth={3}
                dot={{ r: 4 }}
                activeDot={{ r: 6 }}
              />
              <Line
                type="monotone"
                dataKey="sales"
                stroke="url(#salesLine)"
                strokeWidth={3}
                dot={{ r: 4 }}
                activeDot={{ r: 6 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Top Selling Products */}
      <Card className="border border-gray-200 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
        <CardHeader>
          <CardTitle className="font-medium text-gray-800 dark:text-zinc-100">
            Top Selling Products
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {topProducts.map((product) => (
            <div
              key={product.id}
              className="flex items-center justify-between gap-4"
            >
              <div className="flex items-center gap-3">
                <Image
                  src={product.image}
                  alt={product.name}
                  width={60}
                  height={60}
                  className="rounded-md object-cover"
                />
                <div>
                  <p className="font-medium text-gray-900 dark:text-zinc-100">{product.name}</p>
                  <p className="text-sm text-gray-500 dark:text-zinc-400">Sold: {product.sold}</p>
                </div>
              </div>
              <p className="font-semibold text-gray-800 dark:text-zinc-100">
                ₦{product.revenue.toLocaleString()}
              </p>
            </div>
          ))}
        </CardContent>
      </Card>
    </main>
  );
};

export default SellerAnalyticsPage;
