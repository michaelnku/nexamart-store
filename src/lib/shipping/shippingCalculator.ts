export function calculateShippingFee({
  distanceInMiles,
  ratePerMile,
  baseFee,
  expressMultiplier = 1,
  minimumFee = 0,
}: {
  distanceInMiles: number;
  ratePerMile: number;
  baseFee: number;
  expressMultiplier?: number;
  minimumFee?: number;
}) {
  const safeDistance = Math.max(0, distanceInMiles);
  const safeRate = Math.max(0, ratePerMile);
  const safeBase = Math.max(0, baseFee);
  const safeExpress = Math.max(1, expressMultiplier);

  const distanceCharge = safeDistance * safeRate;
  const total = (safeBase + distanceCharge) * safeExpress;

  const rounded = Math.round(total * 100) / 100;

  return Math.max(minimumFee, rounded);
}
