"use client";

import Link from "next/link";
import { useFormatMoneyFromUSD } from "@/hooks/useFormatMoneyFromUSD";

const BUDGETS = [
  { key: "budget-25-50", minUSD: 25, maxUSD: 50 },
  { key: "budget-50-100", minUSD: 50, maxUSD: 100 },
  { key: "budget-101-500", minUSD: 150, maxUSD: 500 },
  { key: "budget-500-plus", minUSD: 500 },
];

export default function ShopByBudget() {
  const formatMoneyFromUSD = useFormatMoneyFromUSD();

  return (
    <section className="space-y-3">
      <h2 className="text-lg font-semibold">Shop by Budget</h2>
      <p className="text-sm text-muted-foreground">
        Curated price ranges in your selected currency.
      </p>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        {BUDGETS.map((b) => (
          <Link
            key={b.key}
            href={{
              pathname: "/products",
              query: {
                minPrice: b.minUSD,
                ...(b.maxUSD ? { maxPrice: b.maxUSD } : {}),
              },
            }}
            className="
              flex items-center justify-center
              rounded-xl border bg-card
              py-4 text-sm font-medium
              hover:bg-muted transition-colors
            "
          >
            {b.maxUSD
              ? `${formatMoneyFromUSD(b.minUSD)} - ${formatMoneyFromUSD(b.maxUSD)}`
              : `${formatMoneyFromUSD(b.minUSD)}+`}
          </Link>
        ))}
      </div>
    </section>
  );
}
