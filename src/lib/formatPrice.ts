import { useCurrencyStore } from "@/stores/useCurrencyStore";

const symbols: Record<string, string> = {
  USD: "$",
  NGN: "₦",
  GBP: "£",
  EUR: "€",
  KES: "KSh",
  ZAR: "R",
  CAD: "$",
};

export function usePrice(amountUSD: number) {
  const { currency, rates } = useCurrencyStore();

  const safeRates = rates ?? { USD: 1 };
  const rate = safeRates[currency] ?? 1;

  const converted = amountUSD * rate;

  return `${symbols[currency] ?? ""}${converted.toLocaleString(undefined, {
    maximumFractionDigits: 2,
  })}`;
}
