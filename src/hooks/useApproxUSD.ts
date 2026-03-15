"use client";

import { useCurrencyStore } from "@/stores/useCurrencyStore";

export function useApproxUSD(amountInSelectedCurrency: number) {
  const { currency, convertToUSD } = useCurrencyStore();

  if (currency === "USD") return null;

  return convertToUSD(amountInSelectedCurrency);
}
