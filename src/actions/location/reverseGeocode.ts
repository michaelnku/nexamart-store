"use server";

import "server-only";
import { MAPBOX_SERVER_TOKEN } from "@/lib/config/mapbox.server";

export async function reverseGeocodeFromCoords({
  latitude,
  longitude,
}: {
  latitude: number;
  longitude: number;
}) {
  if (!MAPBOX_SERVER_TOKEN) {
    throw new Error("Mapbox token not configured.");
  }

  const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${longitude},${latitude}.json?access_token=${MAPBOX_SERVER_TOKEN}`;

  const res = await fetch(url, { cache: "no-store" });

  if (!res.ok) {
    throw new Error("Failed to reverse geocode location.");
  }

  const data = await res.json();
  return data.features?.[0] ?? null;
}
