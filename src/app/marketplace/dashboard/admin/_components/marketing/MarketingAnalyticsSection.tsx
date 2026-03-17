"use client";

import { MousePointerClick, ShoppingBag } from "lucide-react";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

import { AnalyticsRankedList, AnalyticsTrendPanel } from "@/app/marketplace/dashboard/admin/_components/AdminAnalyticsPanels";
import { PremiumPanel } from "@/app/marketplace/_components/PremiumDashboard";
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty";
import type { AdminMarketingDashboardResponse } from "@/lib/services/admin/adminMarketingService";
import { formatAnalyticsCount } from "@/lib/analytics/format";

export function MarketingAnalyticsSection({
  dashboard,
  formatMoney,
}: {
  dashboard: AdminMarketingDashboardResponse;
  formatMoney: (value: number) => string;
}) {
  const ordersUsingCouponsChartData = dashboard.trends.ordersUsingCoupons.map(
    (point) => ({
      label: point.label,
      orders: point.value,
    }),
  );

  return (
    <section className="space-y-6">
      <div className="space-y-1">
        <h2 className="text-lg font-semibold text-slate-950 dark:text-white">
          Campaign Analytics
        </h2>
        <p className="text-sm text-slate-500 dark:text-zinc-400">
          Focused reporting for currently tracked coupon activity.
        </p>
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <AnalyticsTrendPanel
          title="Coupon Usage Over Time"
          description="Coupon redemption events grouped by usage date."
          data={dashboard.trends.couponUsage}
          dataKey="couponUsage"
          color="#7c3aed"
          formatter={(value) => formatAnalyticsCount(value)}
        />

        <PremiumPanel
          title="Banner Click Through Rate"
          description="Banner CTR remains unavailable until impression and click tracking are added to the current data model."
        >
          <Empty className="border-slate-200/80 dark:border-zinc-800">
            <EmptyHeader>
              <EmptyMedia variant="icon">
                <MousePointerClick />
              </EmptyMedia>
              <EmptyTitle>Banner CTR tracking unavailable</EmptyTitle>
              <EmptyDescription>
                Expand the range or wait for banner CTR data to be available.
              </EmptyDescription>
            </EmptyHeader>
          </Empty>
        </PremiumPanel>

        <PremiumPanel
          title="Orders Using Coupons"
          description="Number of orders using at least one coupon."
        >
          {ordersUsingCouponsChartData.length === 0 ? (
            <Empty className="border-slate-200/80 dark:border-zinc-800">
              <EmptyHeader>
                <EmptyMedia variant="icon">
                  <ShoppingBag />
                </EmptyMedia>
                <EmptyTitle>No coupon-backed orders in this range</EmptyTitle>
                <EmptyDescription>
                  Expand the range or wait for coupon-attributed orders to be
                  recorded.
                </EmptyDescription>
              </EmptyHeader>
            </Empty>
          ) : (
            <div className="h-[320px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={ordersUsingCouponsChartData}
                  margin={{ top: 8, right: 12, left: -16, bottom: 0 }}
                >
                  <CartesianGrid stroke="#e2e8f0" strokeDasharray="3 3" />
                  <XAxis
                    dataKey="label"
                    tickLine={false}
                    axisLine={false}
                    tickMargin={10}
                    fontSize={12}
                  />
                  <YAxis
                    tickLine={false}
                    axisLine={false}
                    tickMargin={10}
                    fontSize={12}
                    allowDecimals={false}
                  />
                  <Tooltip
                    formatter={(value: number | string | undefined) => [
                      formatAnalyticsCount(
                        typeof value === "number" ? value : Number(value ?? 0),
                      ),
                      "Orders",
                    ]}
                  />
                  <Bar dataKey="orders" radius={[8, 8, 0, 0]} fill="#0f766e" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </PremiumPanel>

        <AnalyticsRankedList
          title="Top Performing Coupons"
          description="Coupons ranked by paid order GMV attributed in the selected range."
          rows={dashboard.topCoupons}
          primaryFormatter={formatMoney}
          secondaryLabel={(value) =>
            `${formatAnalyticsCount(value)} order${value === 1 ? "" : "s"}`
          }
        />
      </div>
    </section>
  );
}
