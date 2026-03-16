export type AnalyticsDatePreset = "7d" | "30d" | "90d" | "12m" | "custom";

export type AnalyticsDateRange = {
  preset: AnalyticsDatePreset;
  startDate: string;
  endDate: string;
};

const DAY_MS = 24 * 60 * 60 * 1000;

function startOfUtcDay(date: Date) {
  return new Date(
    Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()),
  );
}

function endOfUtcDay(date: Date) {
  return new Date(
    Date.UTC(
      date.getUTCFullYear(),
      date.getUTCMonth(),
      date.getUTCDate(),
      23,
      59,
      59,
      999,
    ),
  );
}

function addUtcDays(date: Date, days: number) {
  return new Date(date.getTime() + days * DAY_MS);
}

function addUtcMonths(date: Date, months: number) {
  return new Date(
    Date.UTC(
      date.getUTCFullYear(),
      date.getUTCMonth() + months,
      date.getUTCDate(),
      date.getUTCHours(),
      date.getUTCMinutes(),
      date.getUTCSeconds(),
      date.getUTCMilliseconds(),
    ),
  );
}

export function toDateInputValue(date: Date) {
  return date.toISOString().slice(0, 10);
}

export function parseDateInputValue(value: string, mode: "start" | "end") {
  if (!value) {
    return null;
  }

  const parsed = new Date(
    `${value}T${mode === "start" ? "00:00:00.000" : "23:59:59.999"}Z`,
  );

  if (Number.isNaN(parsed.getTime())) {
    return null;
  }

  return parsed;
}

export function getPresetLabel(preset: AnalyticsDatePreset) {
  switch (preset) {
    case "7d":
      return "7D";
    case "30d":
      return "30D";
    case "90d":
      return "90D";
    case "12m":
      return "12M";
    default:
      return "Custom";
  }
}

export function createAnalyticsDateRange(
  preset: AnalyticsDatePreset = "30d",
  now = new Date(),
): AnalyticsDateRange {
  const rangeEnd = endOfUtcDay(now);
  let rangeStart = startOfUtcDay(now);

  switch (preset) {
    case "7d":
      rangeStart = addUtcDays(rangeStart, -6);
      break;
    case "30d":
      rangeStart = addUtcDays(rangeStart, -29);
      break;
    case "90d":
      rangeStart = addUtcDays(rangeStart, -89);
      break;
    case "12m":
      rangeStart = startOfUtcDay(addUtcMonths(rangeStart, -11));
      break;
    default:
      break;
  }

  return {
    preset,
    startDate: rangeStart.toISOString(),
    endDate: rangeEnd.toISOString(),
  };
}

export function applyAnalyticsPreset(
  currentRange: AnalyticsDateRange,
  preset: AnalyticsDatePreset,
) {
  if (preset === "custom") {
    return {
      ...currentRange,
      preset: "custom" as const,
    };
  }

  return createAnalyticsDateRange(preset);
}

export function normalizeAnalyticsDateRange(input: {
  preset?: string | null;
  startDate?: string | null;
  endDate?: string | null;
}) {
  const preset =
    input.preset === "7d" ||
    input.preset === "30d" ||
    input.preset === "90d" ||
    input.preset === "12m" ||
    input.preset === "custom"
      ? input.preset
      : "30d";

  if (preset !== "custom") {
    return createAnalyticsDateRange(preset);
  }

  const fallback = createAnalyticsDateRange("30d");
  const start = parseDateInputValue(input.startDate ?? "", "start");
  const end = parseDateInputValue(input.endDate ?? "", "end");

  if (!start || !end || start > end) {
    return fallback;
  }

  return {
    preset: "custom" as const,
    startDate: start.toISOString(),
    endDate: end.toISOString(),
  };
}

export function getPreviousAnalyticsDateRange(range: AnalyticsDateRange) {
  const start = new Date(range.startDate);
  const end = new Date(range.endDate);
  const durationMs = end.getTime() - start.getTime();

  return {
    startDate: new Date(start.getTime() - durationMs - 1).toISOString(),
    endDate: new Date(start.getTime() - 1).toISOString(),
  };
}

export function getAnalyticsBucketGranularity(range: AnalyticsDateRange) {
  const start = new Date(range.startDate);
  const end = new Date(range.endDate);
  const durationDays = Math.ceil((end.getTime() - start.getTime()) / DAY_MS);

  return durationDays > 120 ? "month" : "day";
}
