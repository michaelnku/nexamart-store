export function calculateShippingFee({
  distanceInMiles,
  ratePerMile,
  baseFee,
  expressMultiplier = 1,
}: {
  distanceInMiles: number;
  ratePerMile: number;
  baseFee: number;
  expressMultiplier?: number;
}) {
  const safeDistance = Math.max(0, distanceInMiles);
  const safeRate = Math.max(0, ratePerMile);
  const safeBase = Math.max(0, baseFee);
  const safeExpress = Math.max(1, expressMultiplier);

  const distanceCharge = safeDistance * safeRate;
  const total = (safeBase + distanceCharge) * safeExpress;

  return Math.max(0, Math.round(total * 100) / 100);
}
