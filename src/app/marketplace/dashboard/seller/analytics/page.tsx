"use client";

import Image from "next/image";
import { useState } from "react";
import {
  Package,
  ShoppingBag,
  DollarSign,
  TrendingUp,
  TrendingDown,
} from "lucide-react";

import { useFormatMoneyFromUSD } from "@/hooks/useFormatMoneyFromUSD";
import { AnalyticsLineChart } from "@/components/analytics/AnalyticsLineChart";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

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
  const formatMoneyFromUSD = useFormatMoneyFromUSD();

  const getTrendIcon = (growth: number) => {
    if (growth > 0) {
      return <TrendingUp className="inline-block h-4 w-4 text-green-500" />;
    }

    if (growth < 0) {
      return <TrendingDown className="inline-block h-4 w-4 text-red-500" />;
    }

    return null;
  };

  return (
    <main className="min-h-screen space-y-8 bg-gray-50 px-4 py-6 text-slate-950 dark:bg-zinc-950 dark:text-zinc-100">
      <h1 className="text-2xl font-semibold">Analytics</h1>

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
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
              {formatMoneyFromUSD(performance.revenue.total)}
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
              onChange={(event) => setPeriod(event.target.value)}
            >
              <option>Daily</option>
              <option>Weekly</option>
              <option>Monthly</option>
            </select>
          </CardContent>
        </Card>
      </div>

      <Card className="border border-gray-200 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
        <CardHeader>
          <CardTitle className="font-medium text-gray-800 dark:text-zinc-100">
            Revenue & Sales Trend
          </CardTitle>
        </CardHeader>
        <CardContent>
          <AnalyticsLineChart
            data={mockAnalyticsData}
            xKey="name"
            showLegend
            series={[
              {
                key: "revenue",
                label: "Revenue",
                color: "#10b981",
                valueFormatter: (value) => formatMoneyFromUSD(value),
              },
              {
                key: "sales",
                label: "Sales",
                color: "#3b82f6",
                valueFormatter: (value) => value.toLocaleString(),
              },
            ]}
          />
        </CardContent>
      </Card>

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
                  <p className="font-medium text-gray-900 dark:text-zinc-100">
                    {product.name}
                  </p>
                  <p className="text-sm text-gray-500 dark:text-zinc-400">
                    Sold: {product.sold}
                  </p>
                </div>
              </div>
              <p className="font-semibold text-gray-800 dark:text-zinc-100">
                {formatMoneyFromUSD(product.revenue)}
              </p>
            </div>
          ))}
        </CardContent>
      </Card>
    </main>
  );
};

export default SellerAnalyticsPage;
