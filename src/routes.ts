export const publicRoutes = [
  "/",
  "/403",
  "/auth/forgot-password",
  "/auth/reset-password",
  "/api/uploadthing",
  "/category",
  "/product/:slug",
  "/search",
  "/products",
  "/privacy-policy",
  "/terms-of-service",
  "/cookies",
  "/help",
];

export const authRoutes = [
  "/auth/login",
  "/auth/register",
  "/error",
  "/auth/seller/login",
  "/auth/rider/login",
  "/auth/admin/login",
  "/auth/seller/register",
  "/auth/rider/register",
  "/auth/admin/register",
  "/auth/redirecting",
  "/test",
];

export const apiAuthPrefix = "/api/auth";

export const DEFAULT_LOGIN_REDIRECT = "/";

export const SELLER_LOGIN_REDIRECT = "/marketplace/dashboard/seller";

export const RIDER_LOGIN_REDIRECT = "/marketplace/dashboard/rider";

export const ADMIN_LOGIN_REDIRECT = "/marketplace/dashboard/admin";

export const MODERATOR_LOGIN_REDIRECT = "/marketplace/dashboard/moderator";

export const MARKET_PLACE_LOGIN_REDIRECT = "/marketplace/dashboard";

export const customerRoutePrefix = "/customer";

export const adminRoutePrefix = "/marketplace/dashboard/admin";
export const riderRoutePrefix = "/marketplace/dashboard/rider";
export const sellerRoutePrefix = "/marketplace/dashboard/seller";
export const moderatorRoutePrefix = "/marketplace/dashboard/moderator";
export const systemRoutePrefix = "/marketplace/dashboard/system";

export const sharedRoutes = ["/profile", "/settings"];
