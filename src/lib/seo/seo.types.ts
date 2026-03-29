import type {
  Metadata,
  OpenGraph,
  ResolvedMetadata,
  Robots,
  Twitter,
} from "next";

export type SeoImageInput = {
  url: string;
  alt?: string;
  width?: number;
  height?: number;
};

export type SeoBreadcrumbItem = {
  name: string;
  path: string;
};

export type JsonLd = {
  "@context": "https://schema.org";
  "@type": string;
} & Record<string, unknown>;

export type SeoMetadataInput = {
  title?: string | null;
  description?: string | null;
  path?: string;
  canonicalUrl?: string;
  index?: boolean;
  keywords?: readonly string[] | string[] | null;
  openGraphType?: OpenGraph["type"];
  images?: SeoImageInput[];
  fallbackImage?: SeoImageInput | null;
  twitterCard?: Twitter["card"];
};

export type ResolvedSeoSiteConfig = {
  siteName: string;
  defaultTitle: string;
  titleTemplate: string;
  description: string;
  keywords: readonly string[];
  metadataBase: URL;
  logoPath: string;
  defaultOgImagePath: string;
  twitterHandle: string | null;
  socialProfiles: string[];
  supportEmail: string | null;
};

export type SeoProduct = {
  id: string;
  name: string;
  description: string | null;
  brand?: string | null;
  basePriceUSD: number;
  averageRating: number;
  reviewCount: number;
  isPublished: boolean;
  updatedAt: Date;
  category?: {
    name: string;
    slug: string;
  } | null;
  store?: {
    name: string;
    slug: string;
    isActive?: boolean;
    isDeleted?: boolean;
    isSuspended?: boolean;
  } | null;
  images: Array<{
    imageUrl: string;
  }>;
  variants: Array<{
    priceUSD: number;
    stock: number;
  }>;
  foodProductConfig?: {
    isAvailable: boolean;
    isSoldOut: boolean;
  } | null;
};

export type SeoStore = {
  name: string;
  slug: string;
  description?: string | null;
  tagline?: string | null;
  logo?: string | null;
  bannerImage?: string | null;
  isActive?: boolean;
  isDeleted?: boolean;
  isSuspended?: boolean;
};

export type SeoCategory = {
  name: string;
  slug: string;
  description?: string | null;
  bannerImage?: string | null;
  iconImage?: string | null;
};

export type StaticSeoPageKey =
  | "home"
  | "products"
  | "stores"
  | "categories"
  | "helpCenter"
  | "legalCenter"
  | "privacyPolicy"
  | "termsOfService"
  | "refundPolicy"
  | "sellerAgreement"
  | "deliveryRiderTerms"
  | "communityGuidelines"
  | "prohibitedItemsPolicy"
  | "search";

export type StaticSeoPageDefinition = {
  title: string;
  description: string;
  path: string;
  keywords?: readonly string[];
};

export type RootMetadataParent = Promise<ResolvedMetadata>;

export type SeoRobots = NonNullable<Metadata["robots"]> | Robots;
