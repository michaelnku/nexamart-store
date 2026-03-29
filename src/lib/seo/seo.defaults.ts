import "server-only";

import { getPublicSiteConfiguration } from "@/lib/site-config/siteConfig.public";

import {
  SEO_DEFAULT_DESCRIPTION,
  SEO_DEFAULT_KEYWORDS,
  SEO_DEFAULT_LOGO_PATH,
  SEO_DEFAULT_OG_IMAGE_PATH,
  SEO_DEFAULT_TWITTER_HANDLE,
  SEO_SITE_NAME,
  SEO_SITE_TAGLINE,
} from "./seo.constants";
import type { ResolvedSeoSiteConfig } from "./seo.types";
import {
  getSiteUrl,
  normalizeSocialHandle,
  sanitizeDescription,
} from "./seo.utils";

const FALLBACK_SITE_NAME = SEO_SITE_NAME;

export async function getResolvedSeoSiteConfig(): Promise<ResolvedSeoSiteConfig> {
  const siteConfig = await getPublicSiteConfiguration();
  const siteName = siteConfig.siteName?.trim() || FALLBACK_SITE_NAME;
  const defaultTitle =
    siteConfig.seo?.title?.trim() || `${siteName} | ${SEO_SITE_TAGLINE}`;
  const description = sanitizeDescription(
    siteConfig.seo?.description,
    SEO_DEFAULT_DESCRIPTION,
  );
  const socialProfiles = [
    siteConfig.socialLinks?.facebook,
    siteConfig.socialLinks?.instagram,
    siteConfig.socialLinks?.twitter,
    siteConfig.socialLinks?.youtube,
    siteConfig.socialLinks?.tiktok,
  ].filter((value): value is string => Boolean(value?.trim()));

  return {
    siteName,
    defaultTitle,
    titleTemplate: `%s | ${siteName}`,
    description,
    keywords: SEO_DEFAULT_KEYWORDS,
    metadataBase: new URL(getSiteUrl()),
    logoPath: siteConfig.siteLogoUrl?.trim() || SEO_DEFAULT_LOGO_PATH,
    defaultOgImagePath: SEO_DEFAULT_OG_IMAGE_PATH,
    twitterHandle: normalizeSocialHandle(
      siteConfig.socialLinks?.twitter || SEO_DEFAULT_TWITTER_HANDLE,
    ),
    socialProfiles,
    supportEmail: siteConfig.supportEmail?.trim() || null,
  };
}
