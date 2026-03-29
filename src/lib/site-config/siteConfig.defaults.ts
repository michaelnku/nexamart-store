import type { SiteConfiguration } from "@/generated/prisma/client";
import { APP_LOGO, APP_NAME } from "@/lib/seo";

import type {
  PublicSiteConfiguration,
  SiteConfigurationMutableInput,
} from "./siteConfig.types";

export const SITE_CONFIG_CACHE_TAG = "site-config";

export const DEFAULT_SITE_CONFIGURATION_VALUES: Omit<
  SiteConfiguration,
  "id" | "createdAt" | "updatedAt"
> = {
  singleton: true,
  siteName: APP_NAME,
  siteEmail: "support@nexamart.com",
  sitePhone: null,
  facebookUrl: null,
  instagramUrl: null,
  twitterUrl: null,
  youtubeUrl: null,
  tiktokUrl: null,
  whatsappPhone: null,
  supportEmail: "support@nexamart.com",
  supportPhone: null,
  seoTitle: APP_NAME,
  seoDescription: null,
  siteLogoFileAssetId: null,
  platformCommissionRate: 0.1,
  foodMinimumDeliveryFee: 2,
  generalMinimumDeliveryFee: 5,
  foodBaseDeliveryRate: 1.5,
  foodRatePerMile: 0.7,
  generalBaseDeliveryRate: 2,
  generalRatePerMile: 1,
  expressMultiplier: 1.5,
  pickupFee: 0,
};

export const DEFAULT_PUBLIC_SITE_CONFIGURATION: PublicSiteConfiguration = {
  siteName: APP_NAME,
  siteEmail: "support@nexamart.com",
  sitePhone: null,
  siteLogoUrl: APP_LOGO,
  supportEmail: "support@nexamart.com",
  supportPhone: null,
  whatsappPhone: null,
  socialLinks: {
    facebook: null,
    instagram: null,
    twitter: null,
    youtube: null,
    tiktok: null,
  },
  seo: {
    title: APP_NAME,
    description: null,
  },
};

export function getSiteConfigurationUpdateKeys(
  input: SiteConfigurationMutableInput,
) {
  return Object.keys(input).filter(
    (key) => input[key as keyof SiteConfigurationMutableInput] !== undefined,
  );
}
