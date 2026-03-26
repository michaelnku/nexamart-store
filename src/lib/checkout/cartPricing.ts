import { getCartAvailabilityError } from "@/lib/inventory/cartAvailability";
import {
  assertAvailabilityOnlyFoodCanBeOrdered,
  type FoodProductWithOptions,
  type FoodSelectionInput,
  type FoodSelectionSnapshot,
  type OrderDb,
  shouldReserveInventoryForProduct,
  validateFoodSelections,
} from "@/lib/food/ordering";

type CheckoutCartVariant = {
  id: string;
  priceUSD: number;
  stock: number;
  color?: string | null;
  size?: string | null;
};

type CheckoutCartStore = NonNullable<FoodProductWithOptions["store"]> & {
  id: string;
  userId?: string;
  name?: string;
  type: "FOOD" | "GENERAL";
  shippingRatePerMile?: number;
  latitude?: number | null;
  longitude?: number | null;
};

type CheckoutCartProduct = FoodProductWithOptions & {
  store: CheckoutCartStore;
};

type CheckoutCartSelectedOption = FoodSelectionInput;

export type CheckoutCartPricingItem = {
  id: string;
  quantity: number;
  productId: string;
  variantId: string | null;
  cartItemSelectedOptions?: CheckoutCartSelectedOption[];
  product: CheckoutCartProduct;
  variant: CheckoutCartVariant | null;
};

export type AuthoritativeCartLine = CheckoutCartPricingItem & {
  variantId: string;
  variant: CheckoutCartVariant;
  basePriceUSD: number;
  optionsPriceUSD: number;
  unitPriceUSD: number;
  lineTotalUSD: number;
  selectedOptions: FoodSelectionSnapshot[];
};

type ValidatedSelectionResult = {
  snapshots: FoodSelectionSnapshot[];
  optionsPriceUSD: number;
  selectionFingerprint: string;
};

function assertCartItemHasPurchasableVariant(
  item: CheckoutCartPricingItem,
): asserts item is CheckoutCartPricingItem & {
  variantId: string;
  variant: CheckoutCartVariant;
} {
  if (!item.variantId || !item.variant) {
    throw new Error("Invalid cart item. Please reselect product variant.");
  }
}

function validateInventoryForCartItem(
  item: CheckoutCartPricingItem & {
    variant: CheckoutCartVariant;
  },
): void {
  const stockError = getCartAvailabilityError({
    stock: item.variant.stock,
    requestedQuantity: item.quantity,
    productName: item.product.name,
  });

  if (stockError) {
    throw new Error(stockError);
  }
}

function resolveValidatedSelections(
  item: CheckoutCartPricingItem,
): ValidatedSelectionResult {
  if (!item.product.isFoodProduct) {
    return {
      snapshots: [],
      optionsPriceUSD: 0,
      selectionFingerprint: "",
    };
  }

  return validateFoodSelections({
    product: item.product,
    selections: item.cartItemSelectedOptions ?? [],
    quantity: item.quantity,
  });
}

function buildAuthoritativeCartLine(
  item: CheckoutCartPricingItem & {
    variantId: string;
    variant: CheckoutCartVariant;
  },
  validatedSelections: ValidatedSelectionResult,
): AuthoritativeCartLine {
  const basePriceUSD = item.variant.priceUSD;
  const optionsPriceUSD = validatedSelections.optionsPriceUSD;
  const unitPriceUSD = basePriceUSD + optionsPriceUSD;

  return {
    ...item,
    basePriceUSD,
    optionsPriceUSD,
    unitPriceUSD,
    lineTotalUSD: unitPriceUSD * item.quantity,
    selectedOptions: validatedSelections.snapshots,
  };
}

export async function resolveAuthoritativeCartLines(
  db: OrderDb,
  items: CheckoutCartPricingItem[],
): Promise<AuthoritativeCartLine[]> {
  const resolvedLines: AuthoritativeCartLine[] = [];

  for (const item of items) {
    assertCartItemHasPurchasableVariant(item);

    if (shouldReserveInventoryForProduct(item.product)) {
      validateInventoryForCartItem(item);
    } else {
      await assertAvailabilityOnlyFoodCanBeOrdered(
        db,
        item.product,
        item.quantity,
      );
    }

    const validatedSelections = resolveValidatedSelections(item);
    resolvedLines.push(buildAuthoritativeCartLine(item, validatedSelections));
  }

  return resolvedLines;
}
