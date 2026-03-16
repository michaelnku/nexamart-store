import {
  CURRENCY_LOCALE,
  CURRENCY_PRECISION,
  CURRENCY_SYMBOLS,
  isSupportedCurrency,
} from "./currencyConfig";

export function formatMoney(amount: number, currency: string) {
  const locale = isSupportedCurrency(currency)
    ? CURRENCY_LOCALE[currency]
    : "en-US";
  const decimals = isSupportedCurrency(currency)
    ? CURRENCY_PRECISION[currency]
    : 0;
  const symbol = isSupportedCurrency(currency)
    ? CURRENCY_SYMBOLS[currency]
    : "";

  return `${symbol}${amount.toLocaleString(locale, {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  })}`;
}
