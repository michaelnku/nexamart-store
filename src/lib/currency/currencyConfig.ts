export const DEFAULT_CURRENCY = "USD";
export const CURRENCY_COOKIE_NAME = "preferred_currency";

const CURRENCY_REGISTRY = [
  {
    code: "USD",
    label: "US Dollar",
    locale: "en-US",
    precision: 2,
    symbol: "$",
    enabled: true,
  },
  {
    code: "EUR",
    label: "Euro",
    locale: "de-DE",
    precision: 2,
    symbol: "EUR ",
    enabled: true,
  },
  {
    code: "GBP",
    label: "British Pound",
    locale: "en-GB",
    precision: 2,
    symbol: "GBP ",
    enabled: true,
  },
  {
    code: "CAD",
    label: "Canadian Dollar",
    locale: "en-CA",
    precision: 2,
    symbol: "CA$",
    enabled: true,
  },
  {
    code: "AUD",
    label: "Australian Dollar",
    locale: "en-AU",
    precision: 2,
    symbol: "A$",
    enabled: true,
  },
  {
    code: "JPY",
    label: "Japanese Yen",
    locale: "ja-JP",
    precision: 0,
    symbol: "JPY ",
    enabled: true,
  },
  {
    code: "SGD",
    label: "Singapore Dollar",
    locale: "en-SG",
    precision: 2,
    symbol: "S$",
    enabled: true,
  },
  {
    code: "HKD",
    label: "Hong Kong Dollar",
    locale: "zh-HK",
    precision: 2,
    symbol: "HK$",
    enabled: true,
  },
  {
    code: "KRW",
    label: "South Korean Won",
    locale: "ko-KR",
    precision: 0,
    symbol: "KRW ",
    enabled: true,
  },
  {
    code: "NZD",
    label: "New Zealand Dollar",
    locale: "en-NZ",
    precision: 2,
    symbol: "NZ$",
    enabled: true,
  },
  {
    code: "INR",
    label: "Indian Rupee",
    locale: "en-IN",
    precision: 2,
    symbol: "INR ",
    enabled: true,
  },
  {
    code: "BRL",
    label: "Brazilian Real",
    locale: "pt-BR",
    precision: 2,
    symbol: "BRL ",
    enabled: true,
  },
  {
    code: "MXN",
    label: "Mexican Peso",
    locale: "es-MX",
    precision: 2,
    symbol: "MXN ",
    enabled: true,
  },
  {
    code: "TRY",
    label: "Turkish Lira",
    locale: "tr-TR",
    precision: 2,
    symbol: "TRY ",
    enabled: true,
  },
  {
    code: "NGN",
    label: "Nigerian Naira",
    locale: "en-NG",
    precision: 0,
    symbol: "Naira ",
    enabled: true,
  },
  {
    code: "KES",
    label: "Kenyan Shilling",
    locale: "en-KE",
    precision: 0,
    symbol: "KSh",
    enabled: true,
  },
  {
    code: "ZAR",
    label: "South African Rand",
    locale: "en-ZA",
    precision: 0,
    symbol: "R",
    enabled: true,
  },
  {
    code: "GHS",
    label: "Ghanaian Cedi",
    locale: "en-GH",
    precision: 2,
    symbol: "GHS ",
    enabled: true,
  },
  {
    code: "CHF",
    label: "Swiss Franc",
    locale: "de-CH",
    precision: 2,
    symbol: "CHF ",
    enabled: true,
  },
  {
    code: "SEK",
    label: "Swedish Krona",
    locale: "sv-SE",
    precision: 2,
    symbol: "SEK ",
    enabled: true,
  },
] as const;

type CurrencyRegistryEntry = (typeof CURRENCY_REGISTRY)[number];
export type SupportedCurrency = CurrencyRegistryEntry["code"];

const ENABLED_CURRENCIES = CURRENCY_REGISTRY.filter((currency) => currency.enabled);

export const SUPPORTED_CURRENCIES = ENABLED_CURRENCIES.map(
  (currency) => currency.code,
) as SupportedCurrency[];

export const CURRENCY_LABELS = Object.fromEntries(
  ENABLED_CURRENCIES.map((currency) => [currency.code, currency.label]),
) as Record<SupportedCurrency, string>;

export const CURRENCY_LOCALE = Object.fromEntries(
  ENABLED_CURRENCIES.map((currency) => [currency.code, currency.locale]),
) as Record<SupportedCurrency, string>;

export const CURRENCY_PRECISION = Object.fromEntries(
  ENABLED_CURRENCIES.map((currency) => [currency.code, currency.precision]),
) as Record<SupportedCurrency, number>;

export const CURRENCY_SYMBOLS = Object.fromEntries(
  ENABLED_CURRENCIES.map((currency) => [currency.code, currency.symbol]),
) as Record<SupportedCurrency, string>;

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
