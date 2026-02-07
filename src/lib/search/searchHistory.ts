const KEY = "nexamart_recent_searches";
const MAX = 6;

export function saveLocalSearch(query: string) {
  const q = query.trim().toLowerCase();
  if (!q) return;

  const existing = getLocalSearches().filter((x) => x !== q);
  const updated = [q, ...existing].slice(0, MAX);

  localStorage.setItem(KEY, JSON.stringify(updated));
}

export function getLocalSearches(): string[] {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(localStorage.getItem(KEY) || "[]");
  } catch {
    return [];
  }
}
