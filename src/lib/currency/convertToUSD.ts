export function convertToUSD(
  amount: number,
  currency: string,
  rates: Record<string, number>,
  ratesLoaded = true,
) {
  if (!ratesLoaded || currency === "USD") {
    return amount;
  }

  const rate = rates[currency];
  if (!rate || rate <= 0) {
    return amount;
  }

  return amount / rate;
}
