import { DeliveryType, StoreType } from "@/generated/prisma/client";

type DeliveryPricingConfig = {
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
  foodMinimumDeliveryFee: 2,
  generalMinimumDeliveryFee: 5,
  foodBaseDeliveryRate: 1.5,
  foodRatePerMile: 0.7,
  generalBaseDeliveryRate: 2,
  generalRatePerMile: 1,
  expressMultiplier: 1.5,
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
