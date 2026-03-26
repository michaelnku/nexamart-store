const LEGACY_DEFAULT_STORE_TIME_ZONE = "Africa/Lagos";

function isValidTimeZone(value: string) {
  try {
    new Intl.DateTimeFormat("en-US", { timeZone: value });
    return true;
  } catch {
    return false;
  }
}

function normalizeTimeZone(value?: string | null) {
  const trimmed = value?.trim();
  if (!trimmed) {
    return null;
  }

  return isValidTimeZone(trimmed) ? trimmed : null;
}

export type StoreTimeZoneInput = {
  timeZone?: string | null;
  location?: string | null;
  address?: string | null;
};

export function getDefaultStoreTimeZone() {
  return (
    normalizeTimeZone(process.env.DEFAULT_STORE_TIME_ZONE) ??
    LEGACY_DEFAULT_STORE_TIME_ZONE
  );
}

export function resolveStoreTimeZone(store?: StoreTimeZoneInput | null) {
  return normalizeTimeZone(store?.timeZone) ?? getDefaultStoreTimeZone();
}
