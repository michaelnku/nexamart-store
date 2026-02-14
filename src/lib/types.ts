import {
  DeliveryStatus,
  PaymentMethod,
  Product,
  ProductImage,
  RiderProfile,
  ProductVariant,
  Review,
  SenderType,
  Store,
  TransactionStatus,
  TransactionType,
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

export type OrderTrackItemDTO = {
  id: string;
  quantity: number;

  product: {
    name: string;
    images: {
      imageUrl: string;
    }[];
  };
};

export type OrderTrackDeliveryDTO = {
  status: string;
  rider?: {
    name: string | null;
    email: string;
  } | null;
};

export type DeliveryDTO = {
  id: string;
  orderId: string;
  riderId?: string | null;
  status: DeliveryStatus;
  deliveryAddress?: string | null;
  distance?: number | null;
  fee: number;
  assignedAt?: string | null;
  deliveredAt?: string | null;
};

export type OrderTrackTimelineDTO = {
  id: string;
  status: OrderStatus;
  message?: string | null;
  createdAt: string;
};

export type OrderTrackDTO = {
  id: string;
  trackingNumber: string | null;
  status: OrderStatus;
  deliveryType: DeliveryType;
  deliveryAddress?: string | null;
  paymentMethod?: PaymentMethod | null;
  shippingFee: number;
  totalAmount: number;
  createdAt: string;

  items: {
    id: string;
    quantity: number;
    product: {
      name: string;
      images: { imageUrl: string }[];
    };
  }[];

  delivery?: {
    status: string;
    rider?: {
      name: string | null;
      email: string;
    } | null;
  } | null;

  orderTimelines: OrderTrackTimelineDTO[];
};

export type OrderItemDTO = {
  id: string;
  quantity: number;
  price: number;

  product: {
    id: string;
    name: string;
    images: {
      imageUrl: string;
    }[];
  };

  variant?: {
    id: string;
    color?: string | null;
    size?: string | null;
  } | null;
};

export type OrderSummaryDTO = {
  id: string;
  createdAt: string;
  deliveryType: string;
  trackingNumber: string | null;
  totalAmount: number;
  shippingFee: number;

  items: OrderItemDTO[];
};

export type OrderHistoryItemDTO = {
  id: string;
  createdAt: string;
  status: string;
  totalAmount: number;
  trackingNumber: string | null;

  items: {
    id: string;
    quantity: number;

    product: {
      name: string;
      images: {
        imageUrl: string;
      }[];
    };
  }[];
};

export type OrderHistoryDTO = OrderHistoryItemDTO[];

export type OrderDetailItemDTO = {
  id: string;
  quantity: number;
  price: number;

  product: {
    name: string;
    images: { imageUrl: string }[];
  };

  variant?: {
    color?: string | null;
    size?: string | null;
  } | null;
};

export type OrderSellerGroupDTO = {
  id: string;
  status: string;
  subtotal: number;

  store: {
    name: string;
    slug?: string | null;
  };

  items: OrderDetailItemDTO[];
};

export type OrderDetailDTO = {
  id: string;
  status: string;
  trackingNumber: string | null;
  deliveryType: string;
  deliveryAddress?: string | null;
  paymentMethod?: string | null;
  shippingFee: number;
  totalAmount: number;
  createdAt: string;

  customer: {
    name: string | null;
    email: string;
  };

  sellerGroups: OrderSellerGroupDTO[];
};

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
  distanceInMiles?: number;
  couponId?: string | null;
};

export interface CartItemDTO {
  id: string;
  productId: string;
  variantId: string | null;
  quantity: number;

  product: {
    id: string;
    name: string;
    basePriceUSD: number;
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
      images: ProductImage[];
      store?: {
        type?: "GENERAL" | "FOOD";
      };
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

export type ProfileImage = {
  url: string;
  key: string;
};

export type UserDTO = {
  id: string;
  email: string;
  role: UserRole;

  profileAvatar?: ProfileImage | null;

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

export type TransactionDTO = {
  id: string;
  walletId?: string | null;
  orderId?: string | null;
  userId?: string | null;
  type: TransactionType;
  amount: number;
  reference?: string | null;
  description?: string | null;
  status: TransactionStatus;
  createdAt: string;
  updatedAt: string;
};

export type BuyerWallet = {
  id: string;
  balance: number;
  currency: string;
  transactions: WalletTransaction[];
};

export type OrderStatus =
  | "PENDING"
  | "ACCEPTED"
  | "SHIPPED"
  | "OUT_FOR_DELIVERY"
  | "DELIVERED"
  | "COMPLETED"
  | "CANCELLED"
  | "RETURN_REQUESTED"
  | "RETURNED"
  | "REFUNDED";

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
  sellerGroups: {
    id: string;
    status: string;
  }[];
  customer?: {
    name?: string | null;
  } | null;
};

export type Address = {
  id: string;
  fullName: string;
  phone: string;
  street: string;
  city: string;
  state?: string | null;
  country?: string | null;
  isDefault: boolean;
  label: string;
};

export type PreferencesInput = {
  currency?: string;
  theme?: string;
  emailOrderUpdates?: boolean;
  emailWalletAlerts?: boolean;
  emailPromotions?: boolean;
  emailRecommendations?: boolean;
};

export type ChatMessage = {
  id: string;
  conversationId: string;
  senderType: SenderType;
  content: string;
  createdAt: string;
  readAt?: string | null;
  deliveredAt?: string | null;
  senderId?: string | null;
};

export type InboxPreview = {
  id: string;
  subject: string | null;
  agentId?: string | null;
  agentName?: string | null;
  lastMessage?: {
    content: string;
    createdAt: string;
    senderType: SenderType;
  };
  unreadCount: number;
};

export type NewConversation = {
  id: string;
  subject: string | null;
  messages: ChatMessage[];
};

export type Member = {
  id: string;
  conversationId: String;
  userId: String;
  conversation: string;
};

export type CouponItem = {
  id: string;
  code: string;
  type: string;
  value: number;
  minOrderAmount?: number | null;
  maxDiscount?: number | null;
  perUserLimit?: number | null;
  usageLimit?: number | null;
  validFrom?: string | null;
  validTo?: string | null;
};

export type CouponFormValues = {
  id?: string;
  code: string;
  type: "PERCENTAGE" | "FIXED" | "FREE_SHIPPING";
  value: number;
  minOrderAmount?: number | null;
  maxDiscount?: number | null;
  usageLimit?: number | null;
  perUserLimit?: number | null;
  appliesTo: "ALL" | "FIRST_ORDER" | "NEW_USERS" | "CATEGORY";
  validFrom?: string | null;
  validTo?: string | null;
  isActive?: boolean;
};

export type NotificationDTO = {
  id: string;
  userId: string;
  title: string;
  message: string;
  read: boolean;
  createdAt: string;
};

export type RiderProfileDTO = Pick<
  RiderProfile,
  | "vehicleType"
  | "plateNumber"
  | "licenseNumber"
  | "vehicleColor"
  | "vehicleModel"
  | "isVerified"
  | "isAvailable"
>;
