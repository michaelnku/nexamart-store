"use client";

import { useEffect } from "react";
import { useCurrencyStore } from "@/stores/useCurrencyStore";

export function CurrencyProvider({ children }: { children: React.ReactNode }) {
  const setRates = useCurrencyStore((s) => s.setRates);

  useEffect(() => {
    const fetchRates = async () => {
      try {
        const res = await fetch("/api/currency-rates");
        const data = await res.json();

        setRates(data.rates);
      } catch (error) {
        console.error("Currency fetch failed", error);
      }
    };

    fetchRates();
  }, [setRates]);

  return <>{children}</>;
}
