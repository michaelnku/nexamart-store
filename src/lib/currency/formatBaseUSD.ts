// lib/formatUSD.ts for backend ui
export function formatBaseUSD(amount: number) {
  return `$${amount.toLocaleString(undefined, {
    maximumFractionDigits: 2,
  })}`;
}
