import {
  FoodOption,
  FoodOptionGroup,
  FoodProductConfig,
  Product,
  ProductVariant,
  Review,
  Store,
} from "@/generated/prisma/client";
import type { ProductImageView } from "@/lib/product-images";
import type { JsonFile } from "./shared.types";

export type FullProductVariant = ProductVariant & {
  stock: number;
};

export type ProductStoreView = Pick<
  Store,
  "id" | "userId" | "name" | "slug" | "type"
> & {
  logo: string | null;
  timeZone?: string | null;
  location?: string | null;
  address?: string | null;
};

export type FullProduct = Product & {
  images: ProductImageView[];
  variants: FullProductVariant[];
  store: ProductStoreView;
  foodProductConfig?: FoodProductConfig | null;
  foodOptionGroups?: (FoodOptionGroup & {
    options: FoodOption[];
  })[];
  brand?: string | null;
  category?: {
    id: string;
    name: string;
  } | null;
  reviews?: (Review & {
    user: {
      id: string;
      name: string | null;
      image: string | null;
    };
  })[];
};

export type Category = {
  id: string;
  name: string;
  slug: string;
  parentId?: string | null;
  children?: Category[];
  iconImage?: string | null;
  bannerImage?: string | null;
  color?: string | null;
};

export type WishlistProduct = {
  id: string;
  name: string;
  basePriceUSD: number;
  discount?: number;
  images: ProductImageView[];
  store: { name: string; slug: string };
};

export type WishlistItem = {
  id: string;
  product: WishlistProduct;
};

export type Wishlist = WishlistItem[];

export type ProductCardType = Product & {
  id: string;
  name: string;
  basePriceUSD: number;
  oldPriceUSD?: number | null;
  images: { imageUrl: string }[];
  store: {
    name: string;
    slug: string;
    type?: "GENERAL" | "FOOD";
    timeZone?: string | null;
    location?: string | null;
    address?: string | null;
  };
  foodProductConfig?: Pick<
    FoodProductConfig,
    | "inventoryMode"
    | "isAvailable"
    | "isSoldOut"
    | "dailyOrderLimit"
    | "availableFrom"
    | "availableUntil"
    | "availableDays"
  > | null;
  variants: {
    id: string;
    color: string | null;
    size: string | null;
    priceUSD: number;
    oldPriceUSD?: number | null;
    discount?: number | null;
    stock: number;
  }[];
};

export type ProductImageInput = JsonFile;

export type TechnicalDetail = {
  key: string;
  value: string;
};
