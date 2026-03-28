import { getAvailabilityOnlyFoodOrderability } from "@/lib/food/ordering";

type ProductAvailabilityInput = {
  isFoodProduct: boolean;
  foodProductConfig?: {
    inventoryMode: "STOCK_TRACKED" | "AVAILABILITY_ONLY";
    isAvailable: boolean;
    isSoldOut: boolean;
    dailyOrderLimit?: number | null;
    availableFrom: string | null;
    availableUntil: string | null;
    availableDays: string[];
  } | null;
  store?: {
    timeZone?: string | null;
    location?: string | null;
    address?: string | null;
  } | null;
};

type VariantAvailabilityInput = {
  stock?: number | null;
};

export type ProductAvailabilityState = {
  isOrderable: boolean;
  isInStock: boolean;
  availableStock: number | null;
  label: string;
};

export function getProductAvailabilityState(params: {
  product: ProductAvailabilityInput;
  variant: VariantAvailabilityInput | null | undefined;
  now?: Date;
}): ProductAvailabilityState {
  const { product, variant, now } = params;
  const inventoryMode = product.foodProductConfig?.inventoryMode;

  if (product.isFoodProduct && inventoryMode === "AVAILABILITY_ONLY") {
    const orderability = getAvailabilityOnlyFoodOrderability(
      {
        foodProductConfig: product.foodProductConfig
          ? {
              inventoryMode: product.foodProductConfig.inventoryMode,
              isAvailable: product.foodProductConfig.isAvailable,
              isSoldOut: product.foodProductConfig.isSoldOut,
              dailyOrderLimit: product.foodProductConfig.dailyOrderLimit ?? null,
              availableFrom: product.foodProductConfig.availableFrom,
              availableUntil: product.foodProductConfig.availableUntil,
              availableDays: product.foodProductConfig.availableDays,
            }
          : null,
        store: product.store ?? null,
      },
      now,
    );

    if (orderability.isOrderable) {
      return {
        isOrderable: true,
        isInStock: true,
        availableStock: null,
        label: "Available to order",
      };
    }

    return {
      isOrderable: false,
      isInStock: false,
      availableStock: null,
      label:
        orderability.reason === "SOLD_OUT" ? "Sold out" : "Unavailable now",
    };
  }

  const availableStock = variant?.stock ?? 0;
  const isInStock = availableStock > 0;

  return {
    isOrderable: isInStock,
    isInStock,
    availableStock,
    label: isInStock
      ? `In stock · ${availableStock} available`
      : "Out of stock",
  };
}
