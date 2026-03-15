export function convertFromUSD(
  amountUSD: number,
  currency: string,
  rates: Record<string, number>,
  ratesLoaded = true,
) {
  if (!ratesLoaded || currency === "USD") {
    return Math.round(amountUSD);
  }

  const rate = rates[currency];
  if (!rate) {
    return Math.round(amountUSD);
  }

  return Math.round(amountUSD * rate);
}
