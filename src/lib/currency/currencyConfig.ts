export const DEFAULT_CURRENCY = "USD";

export const SUPPORTED_CURRENCIES = [
  "USD",
  "NGN",
  "GBP",
  "EUR",
  "KES",
  "ZAR",
  "CAD",
] as const;

export type SupportedCurrency = (typeof SUPPORTED_CURRENCIES)[number];

export const CURRENCY_COOKIE_NAME = "preferred_currency";

export const CURRENCY_LABELS: Record<SupportedCurrency, string> = {
  USD: "US Dollar",
  NGN: "Nigerian Naira",
  GBP: "British Pound",
  EUR: "Euro",
  KES: "Kenyan Shilling",
  ZAR: "South African Rand",
  CAD: "Canadian Dollar",
};

export function isSupportedCurrency(
  currency: string | null | undefined,
): currency is SupportedCurrency {
  return SUPPORTED_CURRENCIES.includes(currency as SupportedCurrency);
}

export function getCurrencyCookieValue() {
  if (typeof document === "undefined") {
    return null;
  }

  const cookie = document.cookie
    .split("; ")
    .find((entry) => entry.startsWith(`${CURRENCY_COOKIE_NAME}=`));

  const value = cookie?.split("=")[1];
  const decodedValue = value ? decodeURIComponent(value) : null;

  return isSupportedCurrency(decodedValue) ? decodedValue : null;
}

export function setCurrencyCookie(currency: SupportedCurrency) {
  if (typeof document === "undefined") {
    return;
  }

  document.cookie = `${CURRENCY_COOKIE_NAME}=${encodeURIComponent(currency)}; path=/; max-age=31536000; samesite=lax`;
}
