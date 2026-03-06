"use client";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

type Props = {
  data: {
    date: Date | string;
    revenue: number;
    orders: number;
  }[];
};

export default function SellerAnalyticsChart({ data }: Props) {
  const formatted = data.map((d) => ({
    ...d,
    date: new Date(d.date).toLocaleDateString(),
  }));

  return (
    <div className="w-full h-[320px]">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={formatted}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="date" />
          <YAxis />
          <Tooltip />

          <Line
            type="monotone"
            dataKey="revenue"
            stroke="#3c9ee0"
            strokeWidth={2}
          />

          <Line
            type="monotone"
            dataKey="orders"
            stroke="#000"
            strokeWidth={2}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
