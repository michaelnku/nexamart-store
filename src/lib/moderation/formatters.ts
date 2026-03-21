const moderatorDateTimeFormatter = new Intl.DateTimeFormat("en-GB", {
  day: "2-digit",
  month: "short",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
  timeZone: "Africa/Lagos",
});

const moderatorDateFormatter = new Intl.DateTimeFormat("en-GB", {
  day: "2-digit",
  month: "short",
  year: "numeric",
  timeZone: "Africa/Lagos",
});

const moderatorNumberFormatter = new Intl.NumberFormat("en-US");

export function formatModerationDateTime(value: Date | string) {
  return moderatorDateTimeFormatter.format(new Date(value));
}

export function formatModerationDate(value: Date | string) {
  return moderatorDateFormatter.format(new Date(value));
}

export function formatModerationNumber(value: number) {
  return moderatorNumberFormatter.format(value);
}
