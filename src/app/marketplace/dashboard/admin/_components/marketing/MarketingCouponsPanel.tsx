"use client";

import { MoreHorizontal, Plus, TicketPercent } from "lucide-react";
import Link from "next/link";

import { PremiumPanel } from "@/app/marketplace/_components/PremiumDashboard";
import type { AdminMarketingDashboardResponse } from "@/lib/services/admin/adminMarketingService";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty";
import { formatAnalyticsCount } from "@/lib/analytics/format";
import { cn } from "@/lib/utils";
import { formatCouponValue, formatMarketingDate } from "./marketingShared";

export function MarketingCouponsPanel({
  coupons,
  formatMoney,
  onToggleCoupon,
  onArchiveCoupon,
}: {
  coupons: AdminMarketingDashboardResponse["coupons"];
  formatMoney: (value: number) => string;
  onToggleCoupon: (id: string, nextIsActive: boolean) => void;
  onArchiveCoupon: (id: string) => void;
}) {
  return (
    <PremiumPanel
      title="Coupons & Promotions"
      description="Manage coupon inventory, validity windows, and activation states to drive sales and conversions."
    >
      <div className="mb-5 flex flex-wrap flex-col items-center justify-between gap-3">
        <Button asChild>
          <Link href="/marketplace/dashboard/admin/coupons/create">
            <Plus className="h-4 w-4" />
            Create Coupon
          </Link>
        </Button>
        <p className="text-sm text-slate-500 dark:text-zinc-400">
          Coupons are a great way to drive sales and conversions.
        </p>
      </div>

      {coupons.length === 0 ? (
        <Empty className="border-slate-200/80 dark:border-zinc-800">
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <TicketPercent />
            </EmptyMedia>
            <EmptyTitle>No coupons available</EmptyTitle>
            <EmptyDescription>
              Create a coupon to start driving promotions and conversion reporting.
            </EmptyDescription>
          </EmptyHeader>
        </Empty>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full border-separate border-spacing-0">
            <thead>
              <tr>
                {[
                  "Code",
                  "Type",
                  "Value",
                  "Usage",
                  "Usage Limit",
                  "Min Order",
                  "Active",
                  "Valid From",
                  "Valid To",
                  "Actions",
                ].map((column) => (
                  <th
                    key={column}
                    className="border-b border-slate-200/80 px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.14em] text-slate-500 dark:border-zinc-800 dark:text-zinc-400"
                  >
                    {column}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {coupons.map((coupon) => (
                <tr key={coupon.id}>
                  <td className="border-b border-slate-200/60 px-4 py-4 font-medium text-slate-950 dark:border-zinc-900 dark:text-white">
                    {coupon.code}
                  </td>
                  <td className="border-b border-slate-200/60 px-4 py-4 text-sm text-slate-600 dark:border-zinc-900 dark:text-zinc-300">
                    {coupon.type.toLowerCase().replace("_", " ")}
                  </td>
                  <td className="border-b border-slate-200/60 px-4 py-4 text-sm text-slate-600 dark:border-zinc-900 dark:text-zinc-300">
                    {formatCouponValue(coupon.type, coupon.value) ??
                      formatMoney(coupon.value)}
                  </td>
                  <td className="border-b border-slate-200/60 px-4 py-4 text-sm text-slate-600 dark:border-zinc-900 dark:text-zinc-300">
                    {formatAnalyticsCount(coupon.usageCount)}
                  </td>
                  <td className="border-b border-slate-200/60 px-4 py-4 text-sm text-slate-600 dark:border-zinc-900 dark:text-zinc-300">
                    {coupon.usageLimit
                      ? formatAnalyticsCount(coupon.usageLimit)
                      : "Unlimited"}
                  </td>
                  <td className="border-b border-slate-200/60 px-4 py-4 text-sm text-slate-600 dark:border-zinc-900 dark:text-zinc-300">
                    {coupon.minOrderAmount ? formatMoney(coupon.minOrderAmount) : "None"}
                  </td>
                  <td className="border-b border-slate-200/60 px-4 py-4">
                    <Badge
                      variant="outline"
                      className={cn(
                        coupon.isActive
                          ? "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900/60 dark:bg-emerald-950/30 dark:text-emerald-300"
                          : "border-slate-200 bg-slate-100 text-slate-700 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300",
                      )}
                    >
                      {coupon.isActive ? "Active" : "Disabled"}
                    </Badge>
                  </td>
                  <td className="border-b border-slate-200/60 px-4 py-4 text-sm text-slate-600 dark:border-zinc-900 dark:text-zinc-300">
                    {formatMarketingDate(coupon.validFrom)}
                  </td>
                  <td className="border-b border-slate-200/60 px-4 py-4 text-sm text-slate-600 dark:border-zinc-900 dark:text-zinc-300">
                    {formatMarketingDate(coupon.validTo)}
                  </td>
                  <td className="border-b border-slate-200/60 px-4 py-4">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="outline" size="sm">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem asChild>
                          <Link href={`/marketplace/dashboard/admin/coupons/${coupon.id}`}>
                            Edit coupon
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onSelect={() => onToggleCoupon(coupon.id, !coupon.isActive)}
                        >
                          {coupon.isActive ? "Disable coupon" : "Enable coupon"}
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          className="text-rose-600 focus:text-rose-700 dark:text-rose-300 dark:focus:text-rose-200"
                          onSelect={() => onArchiveCoupon(coupon.id)}
                        >
                          Archive coupon
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </PremiumPanel>
  );
}
