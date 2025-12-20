import {
  CartItem,
  Product,
  ProductImage,
  ProductVariant,
  Review,
  Store,
  UserRole,
} from "@/generated/prisma/client";

export type FullProductVariant = ProductVariant & {
  stock: number;
};

export type FullProduct = Product & {
  images: ProductImage[];
  variants: FullProductVariant[];
  store: Pick<Store, "id" | "userId" | "name" | "slug" | "logo">;
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

export type FullCart = {
  items: (CartItem & {
    product: {
      id: string;
      name: string;
      basePriceUSD: number;
      images: ProductImage[];
    };
    variant?: {
      id: string;
      priceUSD: number;
      color: string | null;
      size: string | null;
    } | null;
  })[];
};

export type WishlistProduct = {
  id: string;
  name: string;
  basePriceUSD: number;
  discount?: number;
  images: ProductImage[];
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
  store: { name: string; slug: string };
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

export type ProductImageInput = {
  url: string;
  key: string;
};

export type TechnicalDetail = {
  key: string;
  value: string;
};

export type UserDTO = {
  id: string;
  email: string;
  role: UserRole;

  name: string;
  username: string;
  image?: string | null;
  isBanned: boolean;

  isVerified: boolean;
};

export type AppUser = UserDTO | null;

export type SessionUser = {
  id?: string | null;
  email?: string | null;
  name?: string | null;
  image?: string | null;
  role?: string | null;
};

export type SearchImage = {
  id: string;
  imageUrl: string;
};

export type SearchStore = {
  id: string;
  name: string;
  slug: string;
  logo?: string | null;
};

export type SearchCategory = {
  id: string;
  name: string;
  slug: string;
  logo?: string | null;
};

export type SearchProduct = {
  id: string;
  name: string;

  priceUSD: number;
  images: {
    imageUrl: string;
  }[];
  store: {
    id: string;
    name: string;
  };
};

export type GlobalSearchResult = {
  products: SearchProduct[];
  nextCursor: string | null;
  stores?: SearchStore[];
  categories?: SearchCategory[];
};

export type SearchProductCard = Pick<
  SearchProduct,
  "id" | "name" | "priceUSD" | "images" | "store"
>;

export type StoreDTO = {
  id: string;
  name: string;
  description: string;
  location: string;

  address?: string | null;

  type: "GENERAL" | "FOOD";
  fulfillmentType: "PHYSICAL" | "DIGITAL" | "HYBRID";

  logo?: string | null;
  logoKey?: string | null;

  bannerImage?: string | null;
  bannerKey?: string | null;

  tagline?: string | null;

  isActive: boolean;
  emailNotificationsEnabled: boolean;
};

export type WalletTransactionType =
  | "DEPOSIT"
  | "REFUND"
  | "EARNING"
  | "ORDER_PAYMENT"
  | "WITHDRAWAL"
  | "SELLER_PAYOUT";

export type WalletTransactionStatus = "SUCCESS" | "PENDING" | "FAILED";

export type WalletTransaction = {
  id: string;
  type: WalletTransactionType;
  amount: number;
  status: WalletTransactionStatus;
  description?: string | null;
  createdAt: string | Date;
};

export type BuyerWallet = {
  id: string;
  balance: number;
  currency: string;
  transactions: WalletTransaction[];
};

export type OrderStatus =
  | "PENDING"
  | "PROCESSING"
  | "SHIPPED"
  | "IN_TRANSIT"
  | "DELIVERED"
  | "CANCELLED"
  | "RETURNED";

export type DeliveryType =
  | "HOME_DELIVERY"
  | "STORE_PICKUP"
  | "STATION_PICKUP"
  | "EXPRESS";

export type SellerOrder = {
  id: string;
  status: OrderStatus;
  deliveryType: DeliveryType;
  totalAmount: number;
  customer?: {
    name?: string | null;
  } | null;
};
