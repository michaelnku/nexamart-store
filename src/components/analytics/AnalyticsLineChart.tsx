"use client";

import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

type AnalyticsLineChartSeries = {
  key: string;
  label: string;
  color: string;
  valueFormatter?: (value: number) => string;
};

type AnalyticsLineChartProps<TData extends Record<string, string | number>> = {
  data: TData[];
  xKey: keyof TData & string;
  series: AnalyticsLineChartSeries[];
  yAxisFormatter?: (value: number) => string;
  showLegend?: boolean;
};

export function AnalyticsLineChart<TData extends Record<string, string | number>>({
  data,
  xKey,
  series,
  yAxisFormatter,
  showLegend = false,
}: AnalyticsLineChartProps<TData>) {
  return (
    <div className="h-[320px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.2} />
          <XAxis dataKey={xKey} tickLine={false} axisLine={false} />
          <YAxis
            tickLine={false}
            axisLine={false}
            tickFormatter={yAxisFormatter}
            width={72}
          />
          <Tooltip
            formatter={(value, name) => {
              const activeSeries = series.find((item) => item.key === name);
              const numericValue = Number(value);

              if (!activeSeries) {
                return [value, name];
              }

              return [
                activeSeries.valueFormatter
                  ? activeSeries.valueFormatter(numericValue)
                  : numericValue,
                activeSeries.label,
              ];
            }}
          />
          {showLegend ? <Legend /> : null}
          {series.map((item) => (
            <Line
              key={item.key}
              type="monotone"
              dataKey={item.key}
              name={item.label}
              stroke={item.color}
              strokeWidth={2.5}
              dot={false}
              activeDot={{ r: 5 }}
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
