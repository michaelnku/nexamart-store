"use client";

import { useEffect } from "react";
import { getCurrencyCookieValue } from "@/lib/currency/currencyConfig";
import { useCurrencyStore } from "@/stores/useCurrencyStore";

export function CurrencyProvider({ children }: { children: React.ReactNode }) {
  const setRates = useCurrencyStore((s) => s.setRates);
  const setCurrency = useCurrencyStore((s) => s.setCurrency);

  useEffect(() => {
    const cookieCurrency = getCurrencyCookieValue();
    if (cookieCurrency) {
      setCurrency(cookieCurrency);
    }
  }, [setCurrency]);

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
