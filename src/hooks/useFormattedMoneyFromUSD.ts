"use client";

import { useCurrencyStore } from "@/stores/useCurrencyStore";
import { CURRENCY_LOCALE } from "@/lib/currencyLocale";
import { CURRENCY_PRECISION } from "@/lib/currencyPrecision";

const symbols: Record<string, string> = {
  USD: "$",
  NGN: "₦",
  GBP: "£",
  EUR: "€",
  KES: "KSh",
  ZAR: "R",
  CAD: "$",
};

export function useFormattedMoneyFromUSD(amountUSD: number) {
  const { currency, convertFromUSD } = useCurrencyStore();

  const converted = convertFromUSD(amountUSD);
  const locale = CURRENCY_LOCALE[currency] ?? "en-US";
  const decimals = CURRENCY_PRECISION[currency] ?? 2;

  return `${symbols[currency] ?? ""}${converted.toLocaleString(locale, {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  })}`;
}
