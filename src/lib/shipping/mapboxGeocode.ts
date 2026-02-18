import "server-only";
import { MAPBOX_SERVER_TOKEN } from "@/lib/config/mapbox.server";

type GeocodeInput = {
  street: string;
  city: string;
  state?: string;
  country: string;
};

type GeocodeResult = {
  latitude: number;
  longitude: number;
};

type MapboxGeocodeResponse = {
  features?: Array<{
    center?: [number, number];
  }>;
};

const MAPBOX_GEOCODE_BASE_URL =
  "https://api.mapbox.com/geocoding/v5/mapbox.places";

export async function geocodeAddress(
  address: GeocodeInput,
): Promise<GeocodeResult> {
  if (!MAPBOX_SERVER_TOKEN) {
    throw new Error(
      "MAPBOX_SECRET_TOKEN is not defined. Server Mapbox services cannot function.",
    );
  }

  const query = [address.street, address.city, address.state, address.country]
    .filter((part) => Boolean(part && part.trim()))
    .join(", ");

  if (!query) {
    throw new Error("Address query is empty");
  }

  const encoded = encodeURIComponent(query);
  const url = `${MAPBOX_GEOCODE_BASE_URL}/${encoded}.json?access_token=${MAPBOX_SERVER_TOKEN}&limit=1`;

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 8000);

  try {
    const response = await fetch(url, {
      method: "GET",
      signal: controller.signal,
      cache: "no-store",
    });

    if (!response.ok) {
      if (process.env.NODE_ENV === "development") {
        console.error("[Mapbox geocode] non-200 response", {
          status: response.status,
          statusText: response.statusText,
          query,
        });
      }
      throw new Error(`Mapbox geocode failed with status ${response.status}`);
    }

    const data = (await response.json()) as MapboxGeocodeResponse;
    const first = data.features?.[0];
    const center = first?.center;

    if (!center || center.length < 2) {
      throw new Error("Invalid address: no geocoding result found");
    }

    const [longitude, latitude] = center;
    if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
      throw new Error("Invalid geocoding coordinates");
    }

    return { latitude, longitude };
  } catch (error) {
    console.error("Mapbox geocode error:", error);
    throw error;
  } finally {
    clearTimeout(timeout);
  }
}
