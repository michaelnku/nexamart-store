import {
  CURRENCY_LOCALE,
  CURRENCY_PRECISION,
  CURRENCY_SYMBOLS,
} from "./currencyConfig";

export function formatMoney(amount: number, currency: string) {
  const locale = CURRENCY_LOCALE[currency] ?? "en-US";
  const decimals = CURRENCY_PRECISION[currency] ?? 0;

  return `${CURRENCY_SYMBOLS[currency] ?? ""}${amount.toLocaleString(locale, {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  })}`;
}
