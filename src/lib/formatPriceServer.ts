//for server pages
const symbols: Record<string, string> = {
  USD: "$",
  NGN: "₦",
  EUR: "€",
  GBP: "£",
  KES: "KSh",
  ZAR: "R",
  CAD: "$",
};

export function formatUSD(amount: number, currency: string = "USD") {
  const symbol = symbols[currency] ?? "";
  return `${symbol}${amount.toLocaleString()}`;
}
