export type StoreShippingBreakdown = {
  storeId: string;
  distanceInMiles: number;
  shippingFeeUSD: number;
};

export type CheckoutPreviewSuccess = {
  subtotalUSD: number;
  shippingFeeUSD: number;
  discountUSD: number;
  totalUSD: number;
  totalDistanceInMiles: number;
  storeBreakdown: StoreShippingBreakdown[];
};

export type CheckoutPreviewResult = CheckoutPreviewSuccess | { error: string };
