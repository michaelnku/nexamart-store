"use client";

import {
  TrendingUp,
  ShoppingBag,
  DollarSign,
  Package,
  Calendar,
  Download,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";

const stats = [
  {
    label: "Total Revenue",
    value: "$0",
    icon: DollarSign,
  },
  {
    label: "Orders",
    value: "0",
    icon: ShoppingBag,
  },
  {
    label: "Products Sold",
    value: "0",
    icon: Package,
  },
  {
    label: "Growth",
    value: "+1%",
    icon: TrendingUp,
  },
];

export default function SellerReportsPage() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">Sales Reports</h1>
          <p className="text-sm text-gray-500">
            Track sales, orders, and performance of your store
          </p>
        </div>

        <div className="flex gap-2">
          <Button variant="outline" className="gap-2">
            <Calendar className="w-4 h-4" />
            Date Range
          </Button>
          <Button className="gap-2 bg-[var(--brand-blue)] hover:bg-[var(--brand-blue-hover)]">
            <Download className="w-4 h-4" />
            Export
          </Button>
        </div>
      </div>

      {/* ───────── STATS CARDS ───────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat) => (
          <Card key={stat.label} className="border shadow-sm">
            <CardContent className="p-5 flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">{stat.label}</p>
                <p className="text-2xl font-bold">{stat.value}</p>
              </div>
              <div
                className="w-10 h-10 rounded-full flex items-center justify-center
                bg-[var(--brand-blue-light)] text-[var(--brand-blue)]"
              >
                <stat.icon className="w-5 h-5" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* ───────── SALES TABLE ───────── */}
      <Card className="border shadow-sm">
        <CardContent className="p-0">
          {/* Table Header */}
          <div className="flex flex-col md:flex-row md:items-center md:justify-between p-5 gap-4">
            <h2 className="text-lg font-semibold">Sales Breakdown</h2>

            <Input
              placeholder="Search orders, products..."
              className="max-w-sm"
            />
          </div>

          <Separator />

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-gray-600">
                <tr>
                  <th className="px-5 py-3 text-left font-medium">Order ID</th>
                  <th className="px-5 py-3 text-left font-medium">Product</th>
                  <th className="px-5 py-3 text-left font-medium">Quantity</th>
                  <th className="px-5 py-3 text-left font-medium">Revenue</th>
                  <th className="px-5 py-3 text-left font-medium">Status</th>
                  <th className="px-5 py-3 text-left font-medium">Date</th>
                </tr>
              </thead>

              <tbody>
                {[1, 2, 3, 4].map((i) => (
                  <tr
                    key={i}
                    className="border-b last:border-b-0 hover:bg-gray-50 transition"
                  >
                    <td className="px-5 py-3 font-medium text-[var(--brand-blue)]">
                      #NX-{1020 + i}
                    </td>
                    <td className="px-5 py-3">Wireless Headset</td>
                    <td className="px-5 py-3">2</td>
                    <td className="px-5 py-3 font-semibold">$120</td>
                    <td className="px-5 py-3">
                      <span
                        className="inline-flex px-2 py-1 text-xs rounded-full
                        bg-green-100 text-green-700 font-medium"
                      >
                        Completed
                      </span>
                    </td>
                    <td className="px-5 py-3 text-gray-500">Aug 12, 2025</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
