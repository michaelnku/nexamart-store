const USD_SCALE = 100;

export function normalizeUSD(value: number) {
  if (!Number.isFinite(value)) {
    return 0;
  }

  return Math.round((value + Number.EPSILON) * USD_SCALE) / USD_SCALE;
}

export function clampNonNegativeUSD(value: number) {
  return Math.max(0, normalizeUSD(value));
}

export function normalizeDiscountPercent(value: number) {
  return Math.max(0, normalizeUSD(value));
}
