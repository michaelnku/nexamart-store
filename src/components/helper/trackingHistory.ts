const KEY = "recent_tracking_numbers";
const MAX = 5;

export function getRecentTrackingNumbers(): string[] {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(localStorage.getItem(KEY) || "[]");
  } catch {
    return [];
  }
}

export function saveTrackingNumber(tracking: string) {
  if (typeof window === "undefined") return;

  const existing = getRecentTrackingNumbers().filter((t) => t !== tracking);

  const updated = [tracking, ...existing].slice(0, MAX);
  localStorage.setItem(KEY, JSON.stringify(updated));
}
