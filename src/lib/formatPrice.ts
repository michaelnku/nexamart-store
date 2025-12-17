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

  const rate = rates[currency] ?? 1;
  const converted = amountUSD * rate;

  return `${symbols[currency] ?? ""}${converted.toLocaleString()}`;
}
