export function extractTrackingNumber(value: string) {
  try {
    const url = new URL(value);
    const parts = url.pathname.split("/");

    return parts[parts.length - 1];
  } catch {
    return value;
  }
}
