"use client";

import {
  ArrowDownRight,
  ArrowRight,
  ArrowUpRight,
} from "lucide-react";

import { AnalyticsLineChart } from "@/components/analytics/AnalyticsLineChart";
import { PremiumPanel } from "@/app/marketplace/_components/PremiumDashboard";
import {
  formatAnalyticsPercent,
  getChangeTone,
} from "@/lib/analytics/format";
import { cn } from "@/lib/utils";

type TrendDatum = {
  label: string;
  value: number;
};

type RankedRow = {
  key: string;
  label: string;
  value: number;
  secondaryValue?: number;
};

type BreakdownRow = {
  key: string;
  label: string;
  count?: number;
  value?: number;
};

export function AnalyticsChangeFooter({ value }: { value: number | null }) {
  const tone = getChangeTone(value);

  return (
    <div
      className={cn(
        "flex items-center justify-between gap-3 rounded-xl px-3 py-2",
        tone === "positive" &&
          "bg-emerald-50/90 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-300",
        tone === "negative" &&
          "bg-rose-50/90 text-rose-700 dark:bg-rose-950/30 dark:text-rose-300",
        tone === "muted" &&
          "bg-slate-100/80 text-slate-600 dark:bg-zinc-900 dark:text-zinc-300",
      )}
    >
      <div className="flex items-center gap-2">
        <span className="flex h-7 w-7 items-center justify-center rounded-full bg-white/80 shadow-sm dark:bg-zinc-950/80">
          {tone === "negative" ? (
            <ArrowDownRight className="h-3.5 w-3.5" />
          ) : tone === "muted" ? (
            <ArrowRight className="h-3.5 w-3.5" />
          ) : (
            <ArrowUpRight className="h-3.5 w-3.5" />
          )}
        </span>
        <div className="space-y-0.5">
          <p className="text-[11px] font-medium uppercase tracking-[0.16em] opacity-70">
            Period change
          </p>
          <p className="text-sm font-semibold">
            {value === null ? "No prior data" : formatAnalyticsPercent(value)}
          </p>
        </div>
      </div>
    </div>
  );
}

export function AnalyticsTrendPanel({
  title,
  description,
  data,
  dataKey,
  color,
  formatter,
}: {
  title: string;
  description: string;
  data: TrendDatum[];
  dataKey: string;
  color: string;
  formatter: (value: number) => string;
}) {
  const chartData = data.map((item) => ({
    label: item.label,
    [dataKey]: item.value,
  }));

  return (
    <PremiumPanel title={title} description={description}>
      <AnalyticsLineChart
        data={chartData}
        xKey="label"
        yAxisFormatter={formatter}
        series={[
          {
            key: dataKey,
            label: title,
            color,
            valueFormatter: formatter,
          },
        ]}
      />
    </PremiumPanel>
  );
}

export function AnalyticsBreakdownList({
  title,
  description,
  rows,
  valueFormatter,
}: {
  title: string;
  description: string;
  rows: BreakdownRow[];
  valueFormatter: (value: number) => string;
}) {
  const max = Math.max(
    ...rows.map((row) => row.count ?? row.value ?? 0),
    0,
  );

  return (
    <PremiumPanel title={title} description={description}>
      <div className="space-y-4">
        {rows.length === 0 ? (
          <p className="text-sm text-slate-500 dark:text-zinc-400">
            No data for this range.
          </p>
        ) : null}
        {rows.map((row) => {
          const numericValue = row.count ?? row.value ?? 0;
          const width = max > 0 ? `${(numericValue / max) * 100}%` : "0%";

          return (
            <div key={row.key} className="space-y-2">
              <div className="flex items-center justify-between gap-4 text-sm">
                <span className="font-medium text-slate-700 dark:text-zinc-200">
                  {row.label}
                </span>
                <span className="text-slate-500 dark:text-zinc-400">
                  {valueFormatter(numericValue)}
                </span>
              </div>
              <div className="h-2 rounded-full bg-slate-100 dark:bg-zinc-900">
                <div
                  className="h-2 rounded-full bg-[linear-gradient(90deg,#0f766e_0%,#38bdf8_100%)]"
                  style={{ width }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </PremiumPanel>
  );
}

export function AnalyticsRankedList({
  title,
  description,
  rows,
  primaryFormatter,
  secondaryLabel,
}: {
  title: string;
  description: string;
  rows: RankedRow[];
  primaryFormatter: (value: number) => string;
  secondaryLabel?: (value: number) => string;
}) {
  return (
    <PremiumPanel title={title} description={description}>
      <div className="space-y-4">
        {rows.length === 0 ? (
          <p className="text-sm text-slate-500 dark:text-zinc-400">
            No data for this range.
          </p>
        ) : null}
        {rows.map((row, index) => (
          <div
            key={row.key}
            className="flex items-center justify-between gap-4 rounded-2xl border border-slate-200/80 px-4 py-3 dark:border-zinc-800"
          >
            <div className="min-w-0">
              <div className="flex items-center gap-3">
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 text-xs font-semibold text-slate-700 dark:bg-zinc-900 dark:text-zinc-200">
                  {index + 1}
                </span>
                <div className="min-w-0">
                  <p className="truncate font-medium text-slate-900 dark:text-white">
                    {row.label}
                  </p>
                  {typeof row.secondaryValue === "number" && secondaryLabel ? (
                    <p className="text-xs text-slate-500 dark:text-zinc-400">
                      {secondaryLabel(row.secondaryValue)}
                    </p>
                  ) : null}
                </div>
              </div>
            </div>
            <div className="text-right font-semibold text-slate-900 dark:text-white">
              {primaryFormatter(row.value)}
            </div>
          </div>
        ))}
      </div>
    </PremiumPanel>
  );
}
