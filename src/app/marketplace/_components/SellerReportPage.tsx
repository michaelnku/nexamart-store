"use client";

import { useState } from "react";
import { useSellerSalesReport } from "@/hooks/useSellerSalesReport";
import { useSellerAnalytics } from "@/hooks/useSellerAnalytics";
import { useFormatMoneyFromUSD } from "@/hooks/useFormatMoneyFromUSD";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { FileChartColumn, LineChart } from "lucide-react";
import SellerAnalyticsChart from "@/lib/services/seller/SellerAnalyticsChart";
import { Separator } from "@/components/ui/separator";
import {
  AnalyticsDatePreset,
  applyAnalyticsPreset,
  createAnalyticsDateRange,
} from "@/lib/analytics/date-range";
import { AnalyticsDateRangeFilter } from "@/components/analytics/AnalyticsDateRangeFilter";

export default function SellerReportsPage() {
  const [tab, setTab] = useState<"sales" | "analytics">("sales");
  const [dateRange, setDateRange] = useState(() => createAnalyticsDateRange());

  const { data, isLoading, isError, error, isFetching } = useSellerSalesReport(
    dateRange.startDate,
    dateRange.endDate,
  );
  const {
    data: analytics,
    isLoading: analyticsLoading,
    isError: analyticsIsError,
    error: analyticsError,
  } = useSellerAnalytics(
    dateRange.startDate,
    dateRange.endDate,
    tab === "analytics",
  );

  const formatMoney = useFormatMoneyFromUSD();
  const stats = data?.stats;
  const salesErrorMessage = "Failed to load sales reports.";
  const analyticsErrorMessage = "Failed to load analytics.";

  const growth =
    stats?.previousRevenue && stats.previousRevenue > 0
      ? ((stats.revenue - stats.previousRevenue) / stats.previousRevenue) * 100
      : 0;

  const noSales =
    !isLoading &&
    !isError &&
    (!data?.sales.rows || data.sales.rows.length === 0);
  const noAnalytics =
    !analyticsLoading &&
    !analyticsIsError &&
    (!analytics || analytics.length === 0);

  return (
    <div className="space-y-8 py-2">
      <AnalyticsDateRangeFilter
        preset={dateRange.preset}
        startDate={dateRange.startDate}
        endDate={dateRange.endDate}
        disabled={isLoading}
        onPresetChange={(preset: AnalyticsDatePreset) =>
          setDateRange((currentRange) =>
            applyAnalyticsPreset(currentRange, preset),
          )
        }
        onCustomRangeApply={({ startDate, endDate }) =>
          setDateRange({
            preset: "custom",
            startDate,
            endDate,
          })
        }
      />

      <Tabs
        value={tab}
        onValueChange={(value) => setTab(value as "sales" | "analytics")}
        className="w-full"
      >
        <TabsList className="h-auto w-full justify-start gap-2 border-b bg-transparent p-0 pb-2">
          <TabsTrigger
            value="sales"
            disabled={isLoading}
            className="min-w-fit gap-2 rounded-md px-3 py-2 data-[state=active]:bg-transparent data-[state=active]:text-[var(--brand-blue)] data-[state=active]:shadow-none"
          >
            <FileChartColumn className="h-4 w-4" />
            Sales
            {tab === "sales" && isFetching ? (
              <span className="text-xs text-muted-foreground">
                Refreshing...
              </span>
            ) : null}
          </TabsTrigger>
          <TabsTrigger
            value="analytics"
            disabled={isLoading}
            className="min-w-fit gap-2 rounded-md px-3 py-2 data-[state=active]:bg-transparent data-[state=active]:text-[var(--brand-blue)] data-[state=active]:shadow-none"
          >
            <LineChart className="h-4 w-4" />
            Analytics
          </TabsTrigger>
        </TabsList>
      </Tabs>

      {tab === "sales" && (
        <>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
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

          {isLoading ? (
            <div className="space-y-3">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
            </div>
          ) : isError ? (
            <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-6 text-sm text-red-700">
              {salesErrorMessage}
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
                  <th className="py-2 text-left">Order</th>
                  <th className="py-2 text-left">Product</th>
                  <th className="py-2 text-left">Qty</th>
                  <th className="py-2 text-left">Revenue</th>
                  <th className="py-2 text-left">Date</th>
                </tr>
              </thead>

              <tbody>
                {data?.sales.rows.map((sale) => (
                  <tr
                    key={`${sale.orderId}-${sale.productName}`}
                    className="border-b"
                  >
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

      {tab === "analytics" && (
        <>
          {analyticsLoading ? (
            <div className="space-y-3">
              <Skeleton className="h-[300px] w-full rounded-lg" />
            </div>
          ) : analyticsIsError ? (
            <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-6 text-sm text-red-700">
              {analyticsErrorMessage}
            </div>
          ) : noAnalytics ? (
            <div className="flex flex-col items-center justify-center py-16 text-center text-muted-foreground">
              <p className="text-lg font-medium">No analytics data yet</p>
              <p className="text-sm">
                Analytics will appear once your first payouts are recorded.
              </p>
            </div>
          ) : (
            <>
              <SellerAnalyticsChart data={analytics ?? []} />

              <Separator />

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
            </>
          )}
        </>
      )}
    </div>
  );
}
