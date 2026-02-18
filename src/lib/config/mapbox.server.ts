import "server-only";

const token = process.env.MAPBOX_SECRET_TOKEN;

if (!token) {
  throw new Error(
    "MAPBOX_SECRET_TOKEN is not defined. Server Mapbox services cannot function.",
  );
}

export const MAPBOX_SERVER_TOKEN: string = token;
