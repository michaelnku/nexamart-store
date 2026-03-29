import "server-only";

import { unstable_cache } from "next/cache";

import type { AdminSiteConfiguration } from "@/lib/site-config/siteConfig.types";
import type { PublicSiteConfiguration } from "@/lib/site-config/siteConfig.types";
import type { DeliveryPricingConfig } from "@/lib/shipping/shippingCalculator";

import {
  DEFAULT_PUBLIC_SITE_CONFIGURATION,
  DEFAULT_SITE_CONFIGURATION_VALUES,
  SITE_CONFIG_CACHE_TAG,
} from "./siteConfig.defaults";
import { getOrCreateSiteConfiguration } from "./siteConfig.service";

export type OrderPricingSiteConfig = DeliveryPricingConfig & {
  pickupFee: number;
  platformCommissionRate: number;
};

export type MarketplaceBrandingSiteConfig = Pick<
  PublicSiteConfiguration,
  "siteName" | "siteEmail" | "sitePhone" | "supportEmail" | "supportPhone"
>;

type OrderFlowSiteConfig = {
  pricing: OrderPricingSiteConfig;
  branding: MarketplaceBrandingSiteConfig;
};

export const DEFAULT_ORDER_PRICING_SITE_CONFIG: OrderPricingSiteConfig = {
  platformCommissionRate: DEFAULT_SITE_CONFIGURATION_VALUES.platformCommissionRate,
  foodMinimumDeliveryFee: DEFAULT_SITE_CONFIGURATION_VALUES.foodMinimumDeliveryFee,
  generalMinimumDeliveryFee:
    DEFAULT_SITE_CONFIGURATION_VALUES.generalMinimumDeliveryFee,
  foodBaseDeliveryRate: DEFAULT_SITE_CONFIGURATION_VALUES.foodBaseDeliveryRate,
  foodRatePerMile: DEFAULT_SITE_CONFIGURATION_VALUES.foodRatePerMile,
  generalBaseDeliveryRate:
    DEFAULT_SITE_CONFIGURATION_VALUES.generalBaseDeliveryRate,
  generalRatePerMile: DEFAULT_SITE_CONFIGURATION_VALUES.generalRatePerMile,
  expressMultiplier: DEFAULT_SITE_CONFIGURATION_VALUES.expressMultiplier,
  pickupFee: DEFAULT_SITE_CONFIGURATION_VALUES.pickupFee,
};

export const DEFAULT_MARKETPLACE_BRANDING_SITE_CONFIG: MarketplaceBrandingSiteConfig =
  {
    siteName: DEFAULT_PUBLIC_SITE_CONFIGURATION.siteName,
    siteEmail: DEFAULT_PUBLIC_SITE_CONFIGURATION.siteEmail,
    sitePhone: DEFAULT_PUBLIC_SITE_CONFIGURATION.sitePhone,
    supportEmail: DEFAULT_PUBLIC_SITE_CONFIGURATION.supportEmail ?? null,
    supportPhone: DEFAULT_PUBLIC_SITE_CONFIGURATION.supportPhone ?? null,
  };

function normalizeNumber(
  value: number | null | undefined,
  fallback: number,
): number {
  return typeof value === "number" && Number.isFinite(value) ? value : fallback;
}

function mapOrderFlowSiteConfig(
  config: AdminSiteConfiguration,
): OrderFlowSiteConfig {
  return {
    pricing: {
      platformCommissionRate: normalizeNumber(
        config.platformCommissionRate,
        DEFAULT_ORDER_PRICING_SITE_CONFIG.platformCommissionRate,
      ),
      foodMinimumDeliveryFee: normalizeNumber(
        config.foodMinimumDeliveryFee,
        DEFAULT_ORDER_PRICING_SITE_CONFIG.foodMinimumDeliveryFee,
      ),
      generalMinimumDeliveryFee: normalizeNumber(
        config.generalMinimumDeliveryFee,
        DEFAULT_ORDER_PRICING_SITE_CONFIG.generalMinimumDeliveryFee,
      ),
      foodBaseDeliveryRate: normalizeNumber(
        config.foodBaseDeliveryRate,
        DEFAULT_ORDER_PRICING_SITE_CONFIG.foodBaseDeliveryRate,
      ),
      foodRatePerMile: normalizeNumber(
        config.foodRatePerMile,
        DEFAULT_ORDER_PRICING_SITE_CONFIG.foodRatePerMile,
      ),
      generalBaseDeliveryRate: normalizeNumber(
        config.generalBaseDeliveryRate,
        DEFAULT_ORDER_PRICING_SITE_CONFIG.generalBaseDeliveryRate,
      ),
      generalRatePerMile: normalizeNumber(
        config.generalRatePerMile,
        DEFAULT_ORDER_PRICING_SITE_CONFIG.generalRatePerMile,
      ),
      expressMultiplier: normalizeNumber(
        config.expressMultiplier,
        DEFAULT_ORDER_PRICING_SITE_CONFIG.expressMultiplier,
      ),
      pickupFee: normalizeNumber(
        config.pickupFee,
        DEFAULT_ORDER_PRICING_SITE_CONFIG.pickupFee,
      ),
    },
    branding: {
      siteName:
        config.siteName?.trim() || DEFAULT_MARKETPLACE_BRANDING_SITE_CONFIG.siteName,
      siteEmail:
        config.siteEmail?.trim() ||
        DEFAULT_MARKETPLACE_BRANDING_SITE_CONFIG.siteEmail,
      sitePhone: config.sitePhone ?? DEFAULT_MARKETPLACE_BRANDING_SITE_CONFIG.sitePhone,
      supportEmail:
        config.supportEmail?.trim() ||
        config.siteEmail?.trim() ||
        DEFAULT_MARKETPLACE_BRANDING_SITE_CONFIG.supportEmail,
      supportPhone:
        config.supportPhone ??
        config.sitePhone ??
        DEFAULT_MARKETPLACE_BRANDING_SITE_CONFIG.supportPhone,
    },
  };
}

const getCachedOrderFlowSiteConfig = unstable_cache(
  async () => {
    const config = await getOrCreateSiteConfiguration();
    return mapOrderFlowSiteConfig(config);
  },
  ["site-config-order-flow"],
  {
    tags: [SITE_CONFIG_CACHE_TAG],
  },
);

export async function getOrderPricingSiteConfig(): Promise<OrderPricingSiteConfig> {
  const config = await getCachedOrderFlowSiteConfig();
  return config.pricing;
}

export async function getMarketplaceBrandingSiteConfig(): Promise<MarketplaceBrandingSiteConfig> {
  const config = await getCachedOrderFlowSiteConfig();
  return config.branding;
}
