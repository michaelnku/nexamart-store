import "server-only";
import { MAPBOX_SERVER_TOKEN } from "@/lib/config/mapbox.server";

type Coordinates = {
  latitude: number;
  longitude: number;
};

type DistanceResult = {
  distanceInMeters: number;
  distanceInMiles: number;
  durationInSeconds: number;
};

type MapboxDirectionsResponse = {
  routes?: Array<{
    distance?: number;
    duration?: number;
  }>;
};

const MAPBOX_BASE_URL = "https://api.mapbox.com/directions/v5/mapbox/driving";

export async function calculateDrivingDistance(
  origin: Coordinates,
  destination: Coordinates,
): Promise<DistanceResult> {
  if (!MAPBOX_SERVER_TOKEN) {
    throw new Error(
      "MAPBOX_SECRET_TOKEN is not defined. Server Mapbox services cannot function.",
    );
  }

  const url =
    `${MAPBOX_BASE_URL}/${origin.longitude},${origin.latitude};` +
    `${destination.longitude},${destination.latitude}` +
    `?access_token=${MAPBOX_SERVER_TOKEN}&alternatives=false&overview=false&steps=false`;

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 8000);

  try {
    const response = await fetch(url, {
      signal: controller.signal,
      method: "GET",
      cache: "no-store",
    });

    if (!response.ok) {
      if (process.env.NODE_ENV === "development") {
        console.error("[Mapbox directions] non-200 response", {
          status: response.status,
          statusText: response.statusText,
          origin,
          destination,
        });
      }
      throw new Error(`Mapbox directions failed with status ${response.status}`);
    }

    const data = (await response.json()) as MapboxDirectionsResponse;
    const route = data.routes?.[0];

    if (!route) {
      throw new Error("No driving route found between origin and destination");
    }

    const distanceInMeters = route.distance ?? 0;
    const durationInSeconds = route.duration ?? 0;

    if (distanceInMeters <= 0) {
      throw new Error("Invalid driving distance returned by Mapbox");
    }

    return {
      distanceInMeters,
      distanceInMiles: distanceInMeters / 1609.34,
      durationInSeconds,
    };
  } catch (error) {
    console.error("Mapbox distance error:", error);
    throw error;
  } finally {
    clearTimeout(timeout);
  }
}
