export const APP_NAME = "NexaMart";
export const APP_DESCRIPTION =
  "NexaMart is a modern multi-vendor e-commerce marketplace where you can shop, sell, and manage deliveries seamlessly.";
export const APP_URL =
  process.env.NEXT_PUBLIC_APP_URL ?? "https://shopnexamart.com";
export const APP_LOGO =
  "https://ijucjait38.ufs.sh/f/rO7LkXAj4RVlnNw2KuOByscQRmqV3jX4rStz8G2Mv0IpxKJA";
export const APP_TWITTER = "@nexamart";

export function absoluteUrl(path = "/") {
  return new URL(path, APP_URL).toString();
}

export function toSeoDescription(text?: string, fallback = APP_DESCRIPTION) {
  if (!text) return fallback;

  const cleaned = text.replace(/\s+/g, " ").trim();

  if (cleaned.length <= 160) return cleaned;

  return `${cleaned.slice(0, 157)}...`;
}
