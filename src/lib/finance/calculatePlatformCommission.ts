export function calculatePlatformCommission(subtotal: number, rate: number) {
  if (subtotal <= 0 || rate <= 0) {
    return {
      platformCommission: 0,
      sellerRevenue: subtotal,
    };
  }

  const commission = Math.round(subtotal * rate * 100) / 100;
  const sellerRevenue = Math.round((subtotal - commission) * 100) / 100;

  return {
    platformCommission: commission,
    sellerRevenue,
  };
}
