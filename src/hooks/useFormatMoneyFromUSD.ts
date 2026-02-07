"use client";

import { formatMoney } from "@/lib/currency/formatMoney";
import { useCurrencyStore } from "@/stores/useCurrencyStore";

export function useFormatMoneyFromUSD() {
  const { currency, convertFromUSD } = useCurrencyStore();

  return (amountUSD: number) => {
    const localAmount = convertFromUSD(amountUSD);
    return formatMoney(localAmount, currency);
  };
}
