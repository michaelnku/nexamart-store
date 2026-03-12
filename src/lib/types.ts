import {
  ConversationType,
  DisputeReason,
  DisputeResolution,
  DisputeStatus,
  DeliveryStatus,
  EmploymentType,
  PaymentMethod,
  Product,
  ProductImage,
  RiderProfile,
  ProductVariant,
  Review,
  SenderType,
  Store,
  VerificationStatus,
  TransactionStatus,
  TransactionType,
  UserRole,
  WithdrawalStatus,
  HeroBanner,
  SiteConfiguration,
  StaffStatus,
  StaffProfile,
  ReturnStatus,
} from "@/generated/prisma/client";

export type FullProductVariant = ProductVariant & {
  stock: number;
};

export type FullProduct = Product & {
  images: ProductImage[];
  variants: FullProductVariant[];
  store: Pick<Store, "id" | "userId" | "name" | "slug" | "logo" | "type">;
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
  isFoodOrder?: boolean;
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
  status: string;
  isFoodOrder?: boolean;
  readyAt: string | null;

  items: OrderItemDTO[];
};

export type OrderHistoryItemDTO = {
  id: string;
  createdAt: string;
  status: string;
  totalAmount: number;
  trackingNumber: string | null;
  isFoodOrder?: boolean;
  prepTimeMinutes?: number | null;
  dispute?: OrderDisputeSummaryDTO | null;

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
  sellerRevenue?: number;
  platformCommission?: number;
  sellerName?: string | null;
  payoutLocked?: boolean;
  payoutStatus?: string;
  payoutReleasedAt?: string | null;

  store: {
    name: string;
    slug?: string | null;
  };

  cancellation?: {
    cancelledAt: string;
    cancelledBy: string;
    reason: string;
    reasonLabel: string;
    note?: string | null;
    refundStatus?: string | null;
    refundMessage?: string | null;
  } | null;

  items: OrderDetailItemDTO[];
};

export type OrderDetailDTO = {
  id: string;
  status: string;
  trackingNumber: string | null;
  isFoodOrder?: boolean;
  deliveryType: string;
  deliveryAddress?: string | null;
  paymentMethod?: string | null;
  shippingFee: number;
  totalAmount: number;
  createdAt: string;
  deliveredAt?: string | null;

  customer: {
    name: string | null;
    email: string;
  };

  sellerGroups: OrderSellerGroupDTO[];
  dispute?: OrderDisputeSummaryDTO | null;
  orderTimelines?: OrderTrackTimelineDTO[];
};

export type DisputeEvidenceDTO = {
  id: string;
  type: string;
  fileUrl: string;
  uploadedByName?: string | null;
  createdAt: string;
};

export type DisputeMessageDTO = {
  id: string;
  senderName?: string | null;
  senderId: string;
  message: string;
  createdAt: string;
};

export type DisputeSellerImpactDTO = {
  id?: string;
  sellerGroupId: string;
  refundAmount: number;
  sellerName?: string | null;
  storeName?: string | null;
};

export type ReturnRequestDTO = {
  id: string;
  status: ReturnStatus;
  trackingNumber?: string | null;
  carrier?: string | null;
  shippedAt?: string | null;
  receivedAt?: string | null;
};

export type OrderDisputeSummaryDTO = {
  id: string;
  orderId: string;
  status: DisputeStatus;
  reason: DisputeReason;
  description?: string | null;
  resolution?: DisputeResolution | null;
  refundAmount?: number | null;
  createdAt: string;
  updatedAt: string;
  openedByName?: string | null;
  resolvedByName?: string | null;
  evidence: DisputeEvidenceDTO[];
  messages: DisputeMessageDTO[];
  sellerImpacts: DisputeSellerImpactDTO[];
  returnRequest?: ReturnRequestDTO | null;
};

export type SellerDisputeListItemDTO = {
  id: string;
  orderId: string;
  customerName?: string | null;
  customerEmail: string;
  status: DisputeStatus;
  reason: DisputeReason;
  createdAt: string;
  updatedAt: string;
  refundAmount?: number | null;
  affectedAmount: number;
  isFoodOrder: boolean;
  impactedGroups: DisputeSellerImpactDTO[];
};

export type SellerDisputeDetailDTO = SellerDisputeListItemDTO & {
  description?: string | null;
  resolution?: DisputeResolution | null;
  returnRequest?: ReturnRequestDTO | null;
  evidence: DisputeEvidenceDTO[];
  messages: DisputeMessageDTO[];
  orderTimelines: OrderTrackTimelineDTO[];
  delivery?: {
    id: string;
    status: string;
    riderName?: string | null;
    riderEmail?: string | null;
    deliveredAt?: string | null;
  } | null;
};

export type AdminDisputeDetailDTO = {
  id: string;
  orderId: string;
  status: DisputeStatus;
  reason: DisputeReason;
  resolution?: DisputeResolution | null;
  description?: string | null;
  refundAmount?: number | null;
  createdAt: string;
  updatedAt: string;
  isFoodOrder: boolean;
  customer: {
    id?: string;
    name?: string | null;
    email: string;
  };
  sellers: Array<{
    sellerId: string;
    sellerName?: string | null;
    storeName?: string | null;
    sellerGroupId: string;
    refundAmount: number;
    payoutLocked?: boolean;
    payoutStatus?: string;
    payoutReleasedAt?: string | null;
  }>;
  delivery?: {
    id: string;
    status: string;
    riderId?: string | null;
    riderName?: string | null;
    riderEmail?: string | null;
    deliveredAt?: string | null;
    payoutLocked?: boolean;
    payoutReleasedAt?: string | null;
  } | null;
  evidence: DisputeEvidenceDTO[];
  messages: DisputeMessageDTO[];
  sellerImpacts: DisputeSellerImpactDTO[];
  returnRequest?: ReturnRequestDTO | null;
  orderTimelines: OrderTrackTimelineDTO[];
  totalAmount: number;
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
      stock: number;
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

export type JsonFile = {
  url: string;
  key: string;
};

export type ProductImageInput = JsonFile;

export type TechnicalDetail = {
  key: string;
  value: string;
};

export type ProfileImage = JsonFile;

export type BannerFile = JsonFile & {
  width?: number | null;
  height?: number | null;
  blurDataURL?: string | null;
};

export type HeroBannerWithFiles = Omit<
  HeroBanner,
  "backgroundImage" | "productImage"
> & {
  backgroundImage: BannerFile;
  productImage: BannerFile | null;
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

  store?: Store | null;
  riderProfile?: RiderProfile | null;
  staffProfile?: StaffProfile | null;
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
  badge?: "ELITE" | "RELIABLE" | "STANDARD" | "LOW_PERFORMANCE";
  onTimeRate?: number;
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
  | "SELLER_PAYOUT"
  | "RIDER_PAYOUT";

export type WalletTransactionStatus =
  | "SUCCESS"
  | "PENDING"
  | "FAILED"
  | "CANCELLED";

export type WalletTransaction = {
  id: string;
  type: WalletTransactionType;
  amount: number;
  status: WalletTransactionStatus;
  orderId?: string | null;
  reference?: string | null;
  description?: string | null;
  source?: "transaction" | "pending-payout";
  createdAt: string | Date;
  activityAt?: string | Date;
  eligibleAt?: string | Date | null;
  deliveredAt?: string | Date | null;
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

export type WithdrawalDTO = {
  id: string;
  walletId: string;
  amount: number;
  method?: string | null;
  accountInfo?: string | null;
  status: WithdrawalStatus;
  processedAt?: string | null;
  createdAt: string;
};

export type SellerWalletDTO = {
  balance: number;
  pending: number;
  totalEarnings: number;
  currency?: string;
  withdrawals: WithdrawalDTO[];
};

export type BuyerWallet = {
  id: string;
  balance: number;
  currency: string;
  transactions: WalletTransaction[];
};

export type OrderStatus =
  | "PENDING_PAYMENT"
  | "PAID"
  | "ACCEPTED"
  | "PREPARING"
  | "READY"
  | "IN_DELIVERY"
  | "DELIVERED"
  | "COMPLETED"
  | "CANCELLED"
  | "RETURN_REQUESTED"
  | "DISPUTED"
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
  isFoodOrder?: boolean;
  deliveryType: DeliveryType;
  totalAmount: number;
  dispute?: {
    id: string;
    status: DisputeStatus;
    reason: DisputeReason;
  } | null;
  sellerGroups: {
    id: string;
    status: string;
    prepTimeMinutes?: number | null;
    readyAt?: string | Date | null;
    store?: {
      name?: string | null;
    } | null;
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
  postalCode?: string | null;
  latitude?: number | null;
  longitude?: number | null;
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
  type: ConversationType;
  subject: string | null;
  agentId?: string | null;
  agentName?: string | null;
  participantName?: string | null;
  participantRole?: UserRole | null;
  productId?: string | null;
  productName?: string | null;
  storeId?: string | null;
  storeName?: string | null;
  canDelete?: boolean;
  lastMessage?: {
    content: string;
    createdAt: string;
    senderType: SenderType;
    senderId?: string | null;
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
  conversationId: string;
  userId: string;
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

export type StaffProfileDTO = {
  id: string;
  userId: string;
  staffId: string;
  firstName: string;
  lastName: string;
  phone?: string | null;
  stripeAccountId?: string | null;
  isVerified: boolean;
  verifiedAt?: Date | null;
  verificationMethod?: string | null;
  verificationStatus: VerificationStatus;
  department?: string | null;
  employmentType?: EmploymentType | null;
  status: StaffStatus;
  joinedAt: Date;
  lastActiveAt?: Date | null;
  createdAt: Date;
  updatedAt: Date;
};

export type FoodDetails = {
  ingredients?: string[];
  preparationTimeMinutes?: number;
  portionSize?: string;
  spiceLevel?: "MILD" | "MEDIUM" | "HOT";
  dietaryTags?: string[];
  isPerishable?: boolean;
  expiresAt?: string | Date;
};

export type SiteConfig = Pick<
  SiteConfiguration,
  | "id"
  | "siteName"
  | "siteEmail"
  | "sitePhone"
  | "siteLogo"
  | "platformCommissionRate"
  | "foodMinimumDeliveryFee"
  | "generalMinimumDeliveryFee"
  | "foodBaseDeliveryRate"
  | "foodRatePerMile"
  | "generalBaseDeliveryRate"
  | "generalRatePerMile"
  | "expressMultiplier"
  | "pickupFee"
  | "createdAt"
  | "updatedAt"
>;

export type StoreState =
  | { status: "loading" }
  | { status: "active"; store: StoreDTO }
  | { status: "deleted" };

export type NotificationType =
  | "ORDER"
  | "DELIVERY"
  | "PAYMENT"
  | "SYSTEM"
  | "PROMOTION";

export type NotificationDTO = {
  id: string;
  title: string;
  message?: string;
  read: boolean;
  createdAt: string;
  type: NotificationType;
  link?: string;
};
