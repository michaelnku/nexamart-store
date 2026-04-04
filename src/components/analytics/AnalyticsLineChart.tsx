"use client";

import {
  CartesianGrid,
  Line,
  LineChart,
  XAxis,
  YAxis,
} from "recharts";
import type { DataKey } from "recharts/types/util/types";

import {
  ChartConfig,
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";

type ChartDatum = Record<string, string | number>;

type ChartAxisKey<TData extends ChartDatum> = Extract<
  DataKey<TData, string | number>,
  string
>;

type ChartSeriesKey<TData extends ChartDatum> = Extract<
  DataKey<TData, number>,
  string
>;

type AnalyticsLineChartSeries<TData extends ChartDatum> = {
  key: ChartSeriesKey<TData>;
  label: string;
  color: string;
  valueFormatter?: (value: number) => string;
};

type AnalyticsLineChartProps<TData extends ChartDatum> = {
  data: TData[];
  xKey: ChartAxisKey<TData>;
  series: AnalyticsLineChartSeries<TData>[];
  yAxisFormatter?: (value: number) => string;
  showLegend?: boolean;
};

export function AnalyticsLineChart<TData extends ChartDatum>({
  data,
  xKey,
  series,
  yAxisFormatter,
  showLegend = false,
}: AnalyticsLineChartProps<TData>) {
  const chartConfig = series.reduce<ChartConfig>((config, item) => {
    config[item.key] = {
      label: item.label,
      color: item.color,
    };

    return config;
  }, {});

  return (
    <ChartContainer config={chartConfig} className="h-[320px] w-full aspect-auto">
      <LineChart
        accessibilityLayer
        data={data}
        margin={{ top: 8, right: 12, left: 12, bottom: 0 }}
      >
        <CartesianGrid vertical={false} strokeDasharray="3 3" strokeOpacity={0.2} />
        <XAxis
          dataKey={xKey}
          tickLine={false}
          axisLine={false}
          tickMargin={8}
        />
        <YAxis
          tickLine={false}
          axisLine={false}
          tickFormatter={yAxisFormatter}
          width={72}
        />
        <ChartTooltip
          cursor={false}
          content={
            <ChartTooltipContent
              formatter={(value, name) => {
                const activeSeries = series.find((item) => item.key === name);
                const numericValue = Number(value);

                return (
                  <div className="flex min-w-[8rem] items-center justify-between gap-4">
                    <span className="text-muted-foreground">
                      {activeSeries?.label ?? String(name)}
                    </span>
                    <span className="font-mono font-medium text-foreground tabular-nums">
                      {activeSeries?.valueFormatter
                        ? activeSeries.valueFormatter(numericValue)
                        : numericValue.toLocaleString()}
                    </span>
                  </div>
                );
              }}
            />
          }
        />
        {showLegend ? (
          <ChartLegend content={<ChartLegendContent />} />
        ) : null}
        {series.map((item) => (
          <Line
            key={item.key}
            type="monotone"
            dataKey={item.key}
            name={item.label}
            stroke={`var(--color-${item.key})`}
            strokeWidth={2.5}
            dot={false}
            activeDot={{ r: 5 }}
          />
        ))}
      </LineChart>
    </ChartContainer>
  );
}
