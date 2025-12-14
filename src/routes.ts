export const publicRoutes = ["/", "/api/uploadthing", "/category"];

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
];

export const apiAuthPrefix = "/api/auth";

export const DEFAULT_LOGIN_REDIRECT = "/";

export const SELLER_LOGIN_REDIRECT = "/market-place/dashboard/seller";

export const RIDER_LOGIN_REDIRECT = "/market-place/dashboard/rider";

export const ADMIN_LOGIN_REDIRECT = "/market-place/dashboard/admin";

export const MARKET_PLACE_LOGIN_REDIRECT = "/market-place/dashboard";

export const adminRoutePrefix = "/market-place/dashboard/admin";
export const riderRoutePrefix = "/market-place/dashboard/rider";
export const sellerRoutePrefix = "/market-place/dashboard/seller";
