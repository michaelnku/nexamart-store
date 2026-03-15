import { CURRENCY_LOCALE } from "./currencyLocale";
import { CURRENCY_PRECISION } from "./currencyPrecision";

const symbols: Record<string, string> = {
  USD: "$",
  NGN: "Naira ",
  GBP: "GBP ",
  EUR: "EUR ",
  KES: "KSh",
  ZAR: "R",
  CAD: "CA$",
};

export function formatMoney(amount: number, currency: string) {
  const locale = CURRENCY_LOCALE[currency] ?? "en-US";
  const decimals = CURRENCY_PRECISION[currency] ?? 0;

  return `${symbols[currency] ?? ""}${amount.toLocaleString(locale, {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  })}`;
}
