import { getCartAvailabilityError } from "@/lib/inventory/cartAvailability";
import {
  assertAvailabilityOnlyFoodCanBeOrdered,
  shouldReserveInventoryForProduct,
  validateFoodSelections,
} from "@/lib/food/ordering";

type CheckoutDb = {
  orderItem: {
    aggregate: (...args: any[]) => Promise<any>;
  };
};

type CheckoutCartItem = {
  id: string;
  quantity: number;
  productId: string;
  variantId: string | null;
  cartItemSelectedOptions?: Array<{
    optionGroupId: string;
    optionId: string;
  }>;
  product: {
    id: string;
    name: string;
    isFoodProduct: boolean;
    store: {
      id: string;
      userId?: string;
      name?: string;
      type: "FOOD" | "GENERAL";
      shippingRatePerMile?: number;
      latitude?: number | null;
      longitude?: number | null;
    };
    foodProductConfig: {
      inventoryMode: "STOCK_TRACKED" | "AVAILABILITY_ONLY";
      isAvailable: boolean;
      isSoldOut: boolean;
      dailyOrderLimit: number | null;
      availableFrom: string | null;
      availableUntil: string | null;
      availableDays: string[];
    } | null;
    foodOptionGroups: Array<{
      id: string;
      name: string;
      type: "SINGLE_SELECT" | "MULTI_SELECT";
      isRequired: boolean;
      minSelections: number;
      maxSelections: number | null;
      isActive: boolean;
      options: Array<{
        id: string;
        name: string;
        priceDeltaUSD: number;
        isAvailable: boolean;
        stock: number | null;
      }>;
    }>;
  };
  variant: {
    id: string;
    priceUSD: number;
    stock: number;
    color?: string | null;
    size?: string | null;
  } | null;
};

export async function resolveAuthoritativeCartLines(
  db: CheckoutDb,
  items: CheckoutCartItem[],
) {
  const resolved = [];

  for (const item of items) {
    if (!item.variantId || !item.variant) {
      throw new Error("Invalid cart item. Please reselect product variant.");
    }

    if (shouldReserveInventoryForProduct(item.product)) {
      const stockError = getCartAvailabilityError({
        stock: item.variant.stock,
        requestedQuantity: item.quantity,
        productName: item.product.name,
      });

      if (stockError) {
        throw new Error(stockError);
      }
    } else {
      await assertAvailabilityOnlyFoodCanBeOrdered(db as any, item.product, item.quantity);
    }

    const validatedSelections = item.product.isFoodProduct
      ? validateFoodSelections({
          product: item.product,
          selections: item.cartItemSelectedOptions ?? [],
          quantity: item.quantity,
        })
      : {
          snapshots: [],
          optionsPriceUSD: 0,
          selectionFingerprint: "",
        };

    const basePriceUSD = item.variant.priceUSD;
    const optionsPriceUSD = validatedSelections.optionsPriceUSD;
    const unitPriceUSD = basePriceUSD + optionsPriceUSD;
    const lineTotalUSD = unitPriceUSD * item.quantity;

    resolved.push({
      ...item,
      basePriceUSD,
      optionsPriceUSD,
      unitPriceUSD,
      lineTotalUSD,
      selectedOptions: validatedSelections.snapshots,
    });
  }

  return resolved;
}
