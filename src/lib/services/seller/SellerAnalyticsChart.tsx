"use client";

import { useFormatMoneyFromUSD } from "@/hooks/useFormatMoneyFromUSD";
import { AnalyticsLineChart } from "@/components/analytics/AnalyticsLineChart";

type Props = {
  data: {
    date: Date | string;
    revenue: number;
    orders: number;
  }[];
};

export default function SellerAnalyticsChart({ data }: Props) {
  const formatMoney = useFormatMoneyFromUSD();
  const formatted = data.map((d) => ({
    ...d,
    date: new Date(d.date).toLocaleDateString(),
  }));

  return (
    <AnalyticsLineChart
      data={formatted}
      xKey="date"
      showLegend
      series={[
        {
          key: "revenue",
          label: "Revenue",
          color: "#3c9ee0",
          valueFormatter: formatMoney,
        },
        {
          key: "orders",
          label: "Orders",
          color: "#0f172a",
          valueFormatter: (value) => `${value}`,
        },
      ]}
    />
  );
}
