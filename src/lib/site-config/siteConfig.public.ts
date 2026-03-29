import "server-only";

import { unstable_cache } from "next/cache";

import { DEFAULT_PUBLIC_SITE_CONFIGURATION, SITE_CONFIG_CACHE_TAG } from "./siteConfig.defaults";
import { getAdminSiteConfiguration } from "./siteConfig.service";
import type { AdminSiteConfiguration, PublicSiteConfiguration } from "./siteConfig.types";

export function serializePublicSiteConfiguration(
  config: AdminSiteConfiguration | null,
): PublicSiteConfiguration {
  if (!config) {
    return DEFAULT_PUBLIC_SITE_CONFIGURATION;
  }

  return {
    siteName: config.siteName?.trim() || DEFAULT_PUBLIC_SITE_CONFIGURATION.siteName,
    siteEmail:
      config.siteEmail?.trim() || DEFAULT_PUBLIC_SITE_CONFIGURATION.siteEmail,
    sitePhone: config.sitePhone?.trim() || null,
    siteLogoUrl: config.siteLogo || DEFAULT_PUBLIC_SITE_CONFIGURATION.siteLogoUrl,
    supportEmail:
      config.supportEmail?.trim() || DEFAULT_PUBLIC_SITE_CONFIGURATION.supportEmail,
    supportPhone: config.supportPhone?.trim() || null,
    whatsappPhone: config.whatsappPhone?.trim() || null,
    socialLinks: {
      facebook: config.facebookUrl?.trim() || null,
      instagram: config.instagramUrl?.trim() || null,
      twitter: config.twitterUrl?.trim() || null,
      youtube: config.youtubeUrl?.trim() || null,
      tiktok: config.tiktokUrl?.trim() || null,
    },
    seo: {
      title: config.seoTitle?.trim() || DEFAULT_PUBLIC_SITE_CONFIGURATION.seo?.title,
      description:
        config.seoDescription?.trim() ||
        DEFAULT_PUBLIC_SITE_CONFIGURATION.seo?.description ||
        null,
    },
  };
}

const getCachedPublicSiteConfiguration = unstable_cache(
  async () => {
    const config = await getAdminSiteConfiguration();
    return serializePublicSiteConfiguration(config);
  },
  ["public-site-configuration"],
  {
    tags: [SITE_CONFIG_CACHE_TAG],
  },
);

export async function getPublicSiteConfiguration() {
  return getCachedPublicSiteConfiguration();
}
