import type { SiteConfig } from "@/lib/types";
import type { JsonFile } from "@/lib/types";

export type SiteConfigurationLogoInput = JsonFile | null | undefined;

export type SiteConfigurationMutableInput = Partial<
  Pick<
    SiteConfig,
    | "siteName"
    | "siteEmail"
    | "sitePhone"
    | "facebookUrl"
    | "instagramUrl"
    | "twitterUrl"
    | "youtubeUrl"
    | "tiktokUrl"
    | "whatsappPhone"
    | "supportEmail"
    | "supportPhone"
    | "seoTitle"
    | "seoDescription"
    | "platformCommissionRate"
    | "foodMinimumDeliveryFee"
    | "generalMinimumDeliveryFee"
    | "foodBaseDeliveryRate"
    | "foodRatePerMile"
    | "generalBaseDeliveryRate"
    | "generalRatePerMile"
    | "expressMultiplier"
    | "pickupFee"
  >
> & {
  siteLogo?: SiteConfigurationLogoInput;
};

export type AdminSiteConfiguration = SiteConfig & {
  siteLogoFileAssetId: string | null;
};

export type PublicSiteConfiguration = {
  siteName: string;
  siteEmail: string;
  sitePhone: string | null;
  siteLogoUrl: string | null;
  supportEmail?: string | null;
  supportPhone?: string | null;
  whatsappPhone?: string | null;
  socialLinks?: {
    facebook?: string | null;
    instagram?: string | null;
    twitter?: string | null;
    youtube?: string | null;
    tiktok?: string | null;
  };
  seo?: {
    title?: string | null;
    description?: string | null;
  };
};

export type SiteSettingsFormValues = {
  siteName: string;
  siteEmail: string;
  sitePhone: string;
  siteLogoUrl: string;
  siteLogoKey: string;
  supportEmail: string;
  supportPhone: string;
  whatsappPhone: string;
  facebookUrl: string;
  instagramUrl: string;
  twitterUrl: string;
  youtubeUrl: string;
  tiktokUrl: string;
  seoTitle: string;
  seoDescription: string;
};
