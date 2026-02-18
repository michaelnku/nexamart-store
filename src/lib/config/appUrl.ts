export function getAppBaseUrl(): string {
  if (process.env.NODE_ENV === "production") {
    if (!process.env.APP_BASE_URL) {
      throw new Error("APP_BASE_URL missing in production");
    }
    return process.env.APP_BASE_URL;
  }

  return "http://localhost:3000";
}
