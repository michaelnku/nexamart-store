import { DeliveryType, StoreType } from "@/generated/prisma/client";
import { DEFAULT_SITE_CONFIGURATION_VALUES } from "@/lib/site-config/siteConfig.defaults";

export type DeliveryPricingConfig = {
  foodMinimumDeliveryFee: number;
  generalMinimumDeliveryFee: number;
  foodBaseDeliveryRate: number;
  foodRatePerMile: number;
  generalBaseDeliveryRate: number;
  generalRatePerMile: number;
  expressMultiplier: number;
};

type StoreDeliveryPricingInput = {
  distanceInMiles: number;
  storeType: StoreType;
  storeRatePerMile: number | null | undefined;
  deliveryType: DeliveryType;
  config?: Partial<DeliveryPricingConfig> | null;
};

const DEFAULT_DELIVERY_PRICING: DeliveryPricingConfig = {
  foodMinimumDeliveryFee: DEFAULT_SITE_CONFIGURATION_VALUES.foodMinimumDeliveryFee,
  generalMinimumDeliveryFee:
    DEFAULT_SITE_CONFIGURATION_VALUES.generalMinimumDeliveryFee,
  foodBaseDeliveryRate: DEFAULT_SITE_CONFIGURATION_VALUES.foodBaseDeliveryRate,
  foodRatePerMile: DEFAULT_SITE_CONFIGURATION_VALUES.foodRatePerMile,
  generalBaseDeliveryRate:
    DEFAULT_SITE_CONFIGURATION_VALUES.generalBaseDeliveryRate,
  generalRatePerMile: DEFAULT_SITE_CONFIGURATION_VALUES.generalRatePerMile,
  expressMultiplier: DEFAULT_SITE_CONFIGURATION_VALUES.expressMultiplier,
};

export function calculateShippingFee({
  distanceInMiles,
  ratePerMile,
  baseFee,
  expressMultiplier = 1,
  minimumFee = 0,
}: {
  distanceInMiles: number;
  ratePerMile: number;
  baseFee: number;
  expressMultiplier?: number;
  minimumFee?: number;
}) {
  const safeDistance = Math.max(0, distanceInMiles);
  const safeRate = Math.max(0, ratePerMile);
  const safeBase = Math.max(0, baseFee);
  const safeExpress = Math.max(1, expressMultiplier);

  const distanceCharge = safeDistance * safeRate;
  const total = (safeBase + distanceCharge) * safeExpress;

  const rounded = Math.round(total * 100) / 100;

  return Math.max(minimumFee, rounded);
}

export function calculateStoreDeliveryFee({
  distanceInMiles,
  storeType,
  storeRatePerMile,
  deliveryType,
  config,
}: StoreDeliveryPricingInput) {
  const pricing = {
    ...DEFAULT_DELIVERY_PRICING,
    ...(config ?? {}),
  };

  const isFood = storeType === "FOOD";
  const baseFee = isFood
    ? pricing.foodBaseDeliveryRate
    : pricing.generalBaseDeliveryRate;
  const siteRatePerMile = isFood
    ? pricing.foodRatePerMile
    : pricing.generalRatePerMile;
  const minimumFee = isFood
    ? pricing.foodMinimumDeliveryFee
    : pricing.generalMinimumDeliveryFee;
  const effectiveRatePerMile =
    storeRatePerMile && storeRatePerMile > 0
      ? storeRatePerMile
      : siteRatePerMile;
  const expressMultiplier =
    deliveryType === "EXPRESS" ? pricing.expressMultiplier : 1;

  return calculateShippingFee({
    distanceInMiles,
    ratePerMile: effectiveRatePerMile,
    baseFee,
    expressMultiplier,
    minimumFee,
  });
}
