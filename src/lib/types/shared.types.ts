import { HeroBanner, SiteConfiguration } from "@/generated/prisma/client";

export type JsonFile = {
  url: string;
  key: string;
};

export type BannerFile = JsonFile & {
  width?: number | null;
  height?: number | null;
  blurDataURL?: string | null;
};

export type ProfileImage = JsonFile;

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

export type HeroBannerWithFiles = Omit<
  HeroBanner,
  "backgroundImage" | "productImage"
> & {
  backgroundImage: BannerFile;
  productImage: BannerFile | null;
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
