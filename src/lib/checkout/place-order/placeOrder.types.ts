import type {
  IdempotencyKey,
  Prisma,
  PrismaClient,
} from "@/generated/prisma/client";
import type { AuthoritativeCartLine } from "@/lib/checkout/cartPricing";

export type StoreGroup = {
  storeId: string;
  sellerId: string;
  sellerRevenue: number;
  platformCommission: number;
  commissionRate: number;
  storeName: string;
  storeType: "FOOD" | "GENERAL";
  items: Array<{
    id: string;
    productId: string;
    variantId: string;
    quantity: number;
    priceUSD: number;
    basePriceUSD: number;
    optionsPriceUSD: number;
    lineTotalUSD: number;
    selectedOptions: Array<{
      optionGroupName: string;
      optionName: string;
      priceDeltaUSD: number;
    }>;
  }>;
  subtotal: number;
  shippingFee: number;
  distanceInMiles: number;
};

export type InternalOrderGroup = {
  isFoodOrder: boolean;
  stores: StoreGroup[];
  subtotal: number;
  shippingFee: number;
  distanceInMiles: number;
  riderPayoutAmount: number;
  totalAmount: number;
};

export type CheckoutCartForOrder = Prisma.CartGetPayload<{
  include: {
    items: {
      include: {
        cartItemSelectedOptions: {
          select: {
            optionGroupId: true;
            optionId: true;
          };
        };
        product: {
          include: {
            store: {
              select: {
                id: true;
                name: true;
                userId: true;
                shippingRatePerMile: true;
                latitude: true;
                longitude: true;
                type: true;
              };
            };
            foodProductConfig: {
              select: {
                inventoryMode: true;
                isAvailable: true;
                isSoldOut: true;
                dailyOrderLimit: true;
                availableFrom: true;
                availableUntil: true;
                availableDays: true;
              };
            };
            foodOptionGroups: {
              where: {
                isActive: true;
              };
              select: {
                id: true;
                name: true;
                type: true;
                isRequired: true;
                minSelections: true;
                maxSelections: true;
                isActive: true;
                options: {
                  select: {
                    id: true;
                    name: true;
                    priceDeltaUSD: true;
                    isAvailable: true;
                    stock: true;
                  };
                };
              };
            };
          };
        };
        variant: {
          select: {
            id: true;
            stock: true;
            priceUSD: true;
            color: true;
            size: true;
          };
        };
      };
    };
  };
}>;

export type ValidatedOrderAddress = Awaited<
  ReturnType<PrismaClient["address"]["findFirst"]>
> extends infer T
  ? Exclude<T, null>
  : never;

export type ExistingIdempotentOrderResult = {
  success: true;
  orderId: string;
  trackingNumber: string | null;
  checkoutGroupId: string | null;
  totalAmount: number;
  orders: Array<{
    orderId: string;
    sellerName: string;
  }>;
};

export type IdempotencyReplayLookup =
  | {
      result: ExistingIdempotentOrderResult;
      existingKey: null;
    }
  | {
      result: null;
      existingKey: IdempotencyKey | null;
    };

export type CreatedOrdersPayload = Array<{
  id: string;
  status: string;
  trackingNumber: string | null;
  isFoodOrder: boolean;
  sellerGroups: Array<{
    id: string;
    sellerId: string;
    storeId: string;
    subtotal: number;
    shippingFee: number;
    storeName: string;
  }>;
}>;

export type WalletSettlementResult = {
  paidOrderIds: string[];
  walletJustPaid: boolean;
};

export type PricedCartItems = AuthoritativeCartLine[];

