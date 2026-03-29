import { getAppBaseUrl } from "@/lib/config/appUrl";

import {
  SEO_DEFAULT_DESCRIPTION,
  SEO_DEFAULT_OG_IMAGE_PATH,
  SEO_DEFAULT_TITLE,
} from "./seo.constants";
import type { SeoImageInput } from "./seo.types";

const TITLE_MAX_LENGTH = 60;
const DESCRIPTION_MAX_LENGTH = 160;
const DEFAULT_OG_IMAGE_WIDTH = 1200;
const DEFAULT_OG_IMAGE_HEIGHT = 630;

export function normalizeBaseUrl(url: string): string {
  const trimmed = url.trim().replace(/\/+$/, "");
  if (!trimmed) {
    return "http://localhost:3000";
  }

  if (/^https?:\/\//i.test(trimmed)) {
    return trimmed;
  }

  return `https://${trimmed}`;
}

export function getSiteUrl(): string {
  return normalizeBaseUrl(getAppBaseUrl());
}

export function buildAbsoluteUrl(path = "/"): string {
  if (/^https?:\/\//i.test(path)) {
    return path;
  }

  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  return new URL(normalizedPath, getSiteUrl()).toString();
}

export function buildCanonicalUrl(path: string): string {
  return buildAbsoluteUrl(path);
}

export function resolveSeoImage(
  image: SeoImageInput | string | null | undefined,
  fallback: SeoImageInput | string = SEO_DEFAULT_OG_IMAGE_PATH,
): SeoImageInput {
  const source = image ?? fallback;

  if (typeof source === "string") {
    return {
      url: buildAbsoluteUrl(source),
      alt: SEO_DEFAULT_TITLE,
      width: DEFAULT_OG_IMAGE_WIDTH,
      height: DEFAULT_OG_IMAGE_HEIGHT,
    };
  }

  return {
    url: buildAbsoluteUrl(source.url),
    alt: source.alt ?? SEO_DEFAULT_TITLE,
    width: source.width ?? DEFAULT_OG_IMAGE_WIDTH,
    height: source.height ?? DEFAULT_OG_IMAGE_HEIGHT,
  };
}

export function mergeOpenGraphImages(
  images: SeoImageInput[] = [],
  fallback?: SeoImageInput | null,
): SeoImageInput[] {
  const merged = [
    ...images.map((image) => resolveSeoImage(image)),
    ...(fallback ? [resolveSeoImage(fallback)] : []),
  ];

  const deduped = new Map<string, SeoImageInput>();

  for (const image of merged) {
    if (!deduped.has(image.url)) {
      deduped.set(image.url, image);
    }
  }

  if (deduped.size === 0) {
    const defaultImage = resolveSeoImage(SEO_DEFAULT_OG_IMAGE_PATH);
    deduped.set(defaultImage.url, defaultImage);
  }

  return [...deduped.values()];
}

export function sanitizeTitle(
  title: string | null | undefined,
  fallback = SEO_DEFAULT_TITLE,
): string {
  const cleaned = title?.replace(/\s+/g, " ").trim();

  if (!cleaned) {
    return fallback;
  }

  const withoutTrailingPunctuation = cleaned.replace(/\s*[|:-]+\s*$/, "");

  if (withoutTrailingPunctuation.length <= TITLE_MAX_LENGTH) {
    return withoutTrailingPunctuation;
  }

  return `${withoutTrailingPunctuation.slice(0, TITLE_MAX_LENGTH - 1).trim()}…`;
}

export function sanitizeDescription(
  text: string | null | undefined,
  fallback = SEO_DEFAULT_DESCRIPTION,
): string {
  const cleaned = text?.replace(/\s+/g, " ").trim();

  if (!cleaned) {
    return fallback;
  }

  if (cleaned.length <= DESCRIPTION_MAX_LENGTH) {
    return cleaned;
  }

  return `${cleaned.slice(0, DESCRIPTION_MAX_LENGTH - 1).trim()}…`;
}

export function sanitizeKeywords(
  keywords: readonly string[] | string[] | null | undefined,
): string[] | undefined {
  if (!keywords?.length) {
    return undefined;
  }

  const unique = Array.from(
    new Set(
      keywords
        .map((keyword) => keyword.trim())
        .filter(Boolean)
        .slice(0, 12),
    ),
  );

  return unique.length > 0 ? unique : undefined;
}

export function normalizeSocialHandle(
  value: string | null | undefined,
): string | null {
  const trimmed = value?.trim();
  if (!trimmed) {
    return null;
  }

  if (trimmed.startsWith("@")) {
    return trimmed;
  }

  if (trimmed.startsWith("https://x.com/") || trimmed.startsWith("https://twitter.com/")) {
    const handle = trimmed.split("/").filter(Boolean).at(-1);
    return handle ? `@${handle.replace(/^@/, "")}` : null;
  }

  return `@${trimmed.replace(/^@/, "")}`;
}
