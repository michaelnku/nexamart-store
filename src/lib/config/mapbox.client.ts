const token = process.env.NEXT_PUBLIC_MAPBOX_PUBLIC_TOKEN;

if (!token && process.env.NODE_ENV === "development") {
  console.warn(
    "[Mapbox] NEXT_PUBLIC_MAPBOX_PUBLIC_TOKEN is missing. Address autocomplete is disabled.",
  );
}

export const MAPBOX_PUBLIC_TOKEN: string = token ?? "";
