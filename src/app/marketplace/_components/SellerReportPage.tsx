"use client";

import { useState } from "react";
import { useSellerSalesReport } from "@/hooks/useSellerSalesReport";
import { useSellerAnalytics } from "@/hooks/useSellerAnalytics";
import { useFormatMoneyFromUSD } from "@/hooks/useFormatMoneyFromUSD";
import { Skeleton } from "@/components/ui/skeleton";

export default function SellerReportsPage() {
  const [tab, setTab] = useState<"sales" | "analytics">("sales");

  const start = new Date();
  start.setDate(start.getDate() - 30);

  const startDate = start.toISOString();
  const endDate = new Date().toISOString();

  const { data, isLoading } = useSellerSalesReport(startDate, endDate);
  const { data: analytics, isLoading: analyticsLoading } = useSellerAnalytics(
    startDate,
    endDate,
  );

  const formatMoney = useFormatMoneyFromUSD();

  const stats = data?.stats;

  const growth =
    stats?.previousRevenue && stats.previousRevenue > 0
      ? ((stats.revenue - stats.previousRevenue) / stats.previousRevenue) * 100
      : 0;

  const noSales =
    !isLoading && (!data?.sales.rows || data.sales.rows.length === 0);
  const noAnalytics =
    !analyticsLoading && (!analytics || analytics.length === 0);

  return (
    <div className="space-y-8">
      {/* Tabs */}

      <div className="flex gap-4 border-b pb-2">
        <button
          disabled={isLoading}
          onClick={() => setTab("sales")}
          className={tab === "sales" ? "font-semibold text-primary" : ""}
        >
          Sales
        </button>
        |
        <button
          disabled={isLoading}
          onClick={() => setTab("analytics")}
          className={tab === "analytics" ? "font-semibold text-primary" : ""}
        >
          Analytics
        </button>
      </div>

      {/* SALES TAB */}

      {tab === "sales" && (
        <>
          {/* Stats Cards */}

          <div className="grid grid-cols-4 gap-4">
            {isLoading ? (
              <>
                <Skeleton className="h-20 w-full rounded-lg" />
                <Skeleton className="h-20 w-full rounded-lg" />
                <Skeleton className="h-20 w-full rounded-lg" />
                <Skeleton className="h-20 w-full rounded-lg" />
              </>
            ) : (
              <>
                <div>
                  <p className="text-sm text-muted-foreground">Revenue</p>
                  <p className="text-xl font-semibold">
                    {formatMoney(stats?.revenue ?? 0)}
                  </p>
                </div>

                <div>
                  <p className="text-sm text-muted-foreground">Orders</p>
                  <p className="text-xl font-semibold">{stats?.orders ?? 0}</p>
                </div>

                <div>
                  <p className="text-sm text-muted-foreground">Products Sold</p>
                  <p className="text-xl font-semibold">
                    {stats?.productsSold ?? 0}
                  </p>
                </div>

                <div>
                  <p className="text-sm text-muted-foreground">Growth</p>
                  <p className="text-xl font-semibold">{growth.toFixed(2)}%</p>
                </div>
              </>
            )}
          </div>

          {/* Sales Table */}

          {isLoading ? (
            <div className="space-y-3">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
            </div>
          ) : noSales ? (
            <div className="flex flex-col items-center justify-center py-16 text-center text-muted-foreground">
              <p className="text-lg font-medium">No sales reports yet</p>
              <p className="text-sm">
                Completed payouts will appear here once orders are finalized.
              </p>
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead className="border-b">
                <tr>
                  <th className="text-left py-2">Order</th>
                  <th className="text-left py-2">Product</th>
                  <th className="text-left py-2">Qty</th>
                  <th className="text-left py-2">Revenue</th>
                  <th className="text-left py-2">Date</th>
                </tr>
              </thead>

              <tbody>
                {data?.sales.rows.map((sale, i) => (
                  <tr key={i} className="border-b">
                    <td className="py-2">{sale.orderId}</td>
                    <td className="py-2">{sale.productName}</td>
                    <td className="py-2">{sale.quantity}</td>
                    <td className="py-2">{formatMoney(sale.revenue)}</td>
                    <td className="py-2">
                      {new Date(sale.date).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </>
      )}

      {/* ANALYTICS TAB */}

      {tab === "analytics" && (
        <>
          {analyticsLoading ? (
            <div className="space-y-3">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
            </div>
          ) : noAnalytics ? (
            <div className="flex flex-col items-center justify-center py-16 text-center text-muted-foreground">
              <p className="text-lg font-medium">No analytics data yet</p>
              <p className="text-sm">
                Analytics will appear once your first payouts are recorded.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {analytics?.map((day) => (
                <div
                  key={day.id}
                  className="flex justify-between border-b pb-2 text-sm"
                >
                  <span>{new Date(day.date).toLocaleDateString()}</span>
                  <span>{formatMoney(day.revenue)}</span>
                  <span>{day.orders} orders</span>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
