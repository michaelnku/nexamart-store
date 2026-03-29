import type { StaticSeoPageDefinition, StaticSeoPageKey } from "./seo.types";

export const PUBLIC_SITEMAP_STATIC_ROUTES = [
  { path: "/", changeFrequency: "daily", priority: 1 },
  { path: "/products", changeFrequency: "daily", priority: 0.9 },
  { path: "/store", changeFrequency: "daily", priority: 0.85 },
  { path: "/category", changeFrequency: "weekly", priority: 0.8 },
  { path: "/help", changeFrequency: "monthly", priority: 0.6 },
  { path: "/legal", changeFrequency: "monthly", priority: 0.5 },
  { path: "/privacy-policy", changeFrequency: "yearly", priority: 0.4 },
  { path: "/terms-of-service", changeFrequency: "yearly", priority: 0.4 },
  { path: "/refund-policy", changeFrequency: "yearly", priority: 0.4 },
  { path: "/seller-agreement", changeFrequency: "yearly", priority: 0.4 },
  { path: "/delivery-rider-terms", changeFrequency: "yearly", priority: 0.4 },
  { path: "/community-guidelines", changeFrequency: "yearly", priority: 0.4 },
  { path: "/prohibited-items-policy", changeFrequency: "yearly", priority: 0.4 },
] as const;

export const ROBOTS_DISALLOW_PATHS = [
  "/admin",
  "/api/",
  "/auth/",
  "/cart",
  "/checkout",
  "/customer/",
  "/dashboard",
  "/history",
  "/marketplace/",
  "/messages",
  "/moderation",
  "/notifications",
  "/orders",
  "/profile",
  "/recommended",
  "/search/history",
  "/settings/",
  "/support",
  "/verification",
  "/wallet",
  "/wishlist",
] as const;

export const STATIC_SEO_PAGES: Record<
  StaticSeoPageKey,
  StaticSeoPageDefinition
> = {
  home: {
    title: "NexaMart",
    description:
      "Shop products, discover trusted stores, and manage delivery orders across NexaMart’s smart online marketplace.",
    path: "/",
  },
  products: {
    title: "Browse Products",
    description:
      "Explore featured, trending, and newly added products across NexaMart’s marketplace.",
    path: "/products",
    keywords: ["marketplace products", "shop products", "online deals"],
  },
  stores: {
    title: "Browse Stores",
    description:
      "Discover active stores, compare storefronts, and shop trusted sellers on NexaMart.",
    path: "/store",
  },
  categories: {
    title: "Browse Categories",
    description:
      "Shop by category across fashion, essentials, electronics, food, and more on NexaMart.",
    path: "/category",
  },
  helpCenter: {
    title: "Help Center",
    description:
      "Find guidance for orders, delivery, payments, disputes, account access, and selling on NexaMart.",
    path: "/help",
  },
  legalCenter: {
    title: "Legal Center",
    description:
      "Review NexaMart’s privacy, marketplace, seller, delivery, refund, and safety policies in one place.",
    path: "/legal",
  },
  privacyPolicy: {
    title: "Privacy Policy",
    description:
      "Learn how NexaMart collects, uses, stores, and protects personal information across the marketplace.",
    path: "/privacy-policy",
  },
  termsOfService: {
    title: "Terms of Service",
    description:
      "Read the core terms governing account access, transactions, payments, and marketplace use on NexaMart.",
    path: "/terms-of-service",
  },
  refundPolicy: {
    title: "Refund Policy",
    description:
      "Understand how refunds, returns, cancellations, and order disputes are handled on NexaMart.",
    path: "/refund-policy",
  },
  sellerAgreement: {
    title: "Seller Agreement",
    description:
      "Review seller responsibilities, listing rules, commissions, fulfillment duties, and compliance terms on NexaMart.",
    path: "/seller-agreement",
  },
  deliveryRiderTerms: {
    title: "Delivery & Rider Terms",
    description:
      "Understand pickup, transportation, handoff, delivery verification, and rider responsibilities on NexaMart.",
    path: "/delivery-rider-terms",
  },
  communityGuidelines: {
    title: "Community Guidelines",
    description:
      "Review the standards for respectful communication, honest marketplace behavior, and platform safety on NexaMart.",
    path: "/community-guidelines",
  },
  prohibitedItemsPolicy: {
    title: "Prohibited Items Policy",
    description:
      "See which products, services, and listings are restricted or prohibited on NexaMart.",
    path: "/prohibited-items-policy",
  },
  search: {
    title: "Search",
    description:
      "Search products, stores, and categories across the NexaMart marketplace.",
    path: "/search",
  },
};
