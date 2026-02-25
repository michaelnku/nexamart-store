"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useFormatMoneyFromUSD } from "@/hooks/useFormatMoneyFromUSD";
import { formatBaseUSD } from "@/lib/currency/formatBaseUSD";

const BUDGETS = [
  { key: "budget-25-49", minUSD: 25, maxUSD: 49 },
  { key: "budget-50-99", minUSD: 50, maxUSD: 99 },
  { key: "budget-100-499", minUSD: 100, maxUSD: 499 },
  { key: "budget-500-plus", minUSD: 500 },
];

export default function ShopByBudget() {
  const formatMoneyFromUSD = useFormatMoneyFromUSD();
  const [isHydrated, setIsHydrated] = useState(false);

  useEffect(() => {
    setIsHydrated(true);
  }, []);

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
              ? isHydrated
                ? `${formatMoneyFromUSD(b.minUSD)} - ${formatMoneyFromUSD(b.maxUSD)}`
                : `${formatBaseUSD(b.minUSD)} - ${formatBaseUSD(b.maxUSD)}`
              : isHydrated
                ? `${formatMoneyFromUSD(b.minUSD)}+`
                : `${formatBaseUSD(b.minUSD)}+`}
          </Link>
        ))}
      </div>
    </section>
  );
}
