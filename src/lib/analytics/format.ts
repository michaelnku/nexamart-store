export function formatAnalyticsCount(value: number | null | undefined) {
  return new Intl.NumberFormat("en-US", {
    maximumFractionDigits: 0,
  }).format(value ?? 0);
}

export function formatAnalyticsDecimal(
  value: number | null | undefined,
  maximumFractionDigits = 1,
) {
  return new Intl.NumberFormat("en-US", {
    maximumFractionDigits,
  }).format(value ?? 0);
}

export function formatAnalyticsPercent(value: number | null | undefined) {
  if (value === null || value === undefined || !Number.isFinite(value)) {
    return "0%";
  }

  return `${value > 0 ? "+" : ""}${formatAnalyticsDecimal(value, 1)}%`;
}

export function calculateChange(current: number, previous: number) {
  if (!Number.isFinite(previous) || previous <= 0) {
    return null;
  }

  return ((current - previous) / previous) * 100;
}

export function getChangeTone(value: number | null) {
  if (value === null || !Number.isFinite(value)) {
    return "muted";
  }

  if (value > 0) {
    return "positive";
  }

  if (value < 0) {
    return "negative";
  }

  return "muted";
}
