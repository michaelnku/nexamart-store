"use client";

import { useEffect } from "react";
import { useCurrencyStore } from "@/stores/useCurrencyStore";

export default function CurrencyRateBootstrap() {
  const setRates = useCurrencyStore((s) => s.setRates);

  useEffect(() => {
    const loadRates = async () => {
      try {
        const res = await fetch("/api/currency-rates");
        const data = await res.json();

        if (data?.rates) {
          setRates({
            USD: 1,
            ...data.rates,
          });
        }
      } catch (e) {
        console.error("Failed to load currency rates", e);
      }
    };

    loadRates();
  }, [setRates]);

  return null;
}
