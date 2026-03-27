import type { ProductImageView } from "@/lib/product-images";

export type CheckoutCartItem = {
  productId: string;
  variantId: string | null;
  quantity: number;
};

export type CheckoutPayload = {
  cartItems: CheckoutCartItem[];
  userId: string;
  addressId: string;
  deliveryType: "HOME_DELIVERY" | "STATION_PICKUP" | "EXPRESS" | "STORE_PICKUP";
  couponId?: string | null;
};

export interface CartItemDTO {
  id: string;
  productId: string;
  variantId: string | null;
  selectionFingerprint: string;
  quantity: number;
  cartItemSelectedOptions?: {
    id: string;
    optionGroupId: string;
    optionId: string;
    optionGroupName: string;
    optionName: string;
    priceDeltaUSD: number;
  }[];

  product: {
    id: string;
    name: string;
    basePriceUSD: number;
    isFoodProduct?: boolean;
    images: { imageUrl: string }[];
  };

  variant?: {
    id: string;
    priceUSD: number;
    color?: string | null;
    size?: string | null;
  } | null;
}

export type FullCart = {
  items: (CartItemDTO & {
    product: {
      id: string;
      name: string;
      basePriceUSD: number;
      isFoodProduct?: boolean;
      images: ProductImageView[];
      store?: {
        type?: "GENERAL" | "FOOD";
      };
      foodProductConfig?: {
        inventoryMode: "STOCK_TRACKED" | "AVAILABILITY_ONLY";
      } | null;
    };
    variant?: {
      id: string;
      priceUSD: number;
      stock: number;
      color: string | null;
      size: string | null;
    } | null;
  })[];
};
