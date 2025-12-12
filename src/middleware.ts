import NextAuth from "next-auth";
import {
  publicRoutes,
  DEFAULT_LOGIN_REDIRECT,
  apiAuthPrefix,
  authRoutes,
  adminRoutePrefix,
  sellerRoutePrefix,
  riderRoutePrefix,
  ADMIN_LOGIN_REDIRECT,
  RIDER_LOGIN_REDIRECT,
  SELLER_LOGIN_REDIRECT,
} from "@/routes";
import authConfig from "./auth.config";

const { auth: Middleware } = NextAuth(authConfig);

export default Middleware((req) => {
  const { nextUrl } = req;
  const pathname = nextUrl.pathname;
  const isLoggedIn = !!req.auth;
  const role = req.auth?.user.role;

  const isPublicRoute = publicRoutes.includes(pathname);
  const isAuthRoute = authRoutes.includes(pathname);
  const isApiAuthRoute = pathname.startsWith(apiAuthPrefix);

  const isAdminRoute = pathname.startsWith(adminRoutePrefix);
  const isSellerRoute = pathname.startsWith(sellerRoutePrefix);
  const isRiderRoute = pathname.startsWith(riderRoutePrefix);

  console.log("Middleware isLoggedIn:", !!req.auth);

  // --- DEBUG LOGGING ---
  if (process.env.NODE_ENV === "development") {
    console.log("\n🔍 Middleware Debug Info:");
    console.log("➡️ Path:", pathname);
    console.log("👤 Logged In:", isLoggedIn);
    console.log("🌐 isPublicRoute:", isPublicRoute);
    console.log("🔐 isAuthRoute:", isAuthRoute);
    console.log("🧩 isApiAuthRoute:", isApiAuthRoute);
    console.log("---------------------------");
  }
  // ✅ Skip all /api/auth/* routes
  if (isApiAuthRoute) {
    console.log("⏭ Skipping API Auth route\n");
    return;
  }

  // ✅ If user is logged in and visits /login or /register → redirect to dashboard
  if (isAuthRoute && isLoggedIn) {
    if (req.auth?.user.role == "ADMIN")
      return Response.redirect(new URL(ADMIN_LOGIN_REDIRECT, nextUrl));

    if (req.auth?.user.role == "RIDER")
      return Response.redirect(new URL(RIDER_LOGIN_REDIRECT, nextUrl));

    if (req.auth?.user.role == "SELLER")
      return Response.redirect(new URL(SELLER_LOGIN_REDIRECT, nextUrl));

    console.log("🔁 Redirecting logged-in user away from auth route\n");
    return Response.redirect(new URL(DEFAULT_LOGIN_REDIRECT, nextUrl));
  }

  // ✅ If user is not logged in and visits a protected page → redirect to /login
  if (!isLoggedIn && !isPublicRoute && !isAuthRoute) {
    console.log("🚫 Not logged in → redirecting to /login\n");
    return Response.redirect(new URL("/login", nextUrl));
  }

  // 🚫 Role-based route protection
  // if (isAdminRoute && role !== "ADMIN") {
  //   return Response.redirect(new URL(ADMIN_LOGIN_REDIRECT, nextUrl));
  // }

  // if (isSellerRoute && role !== "SELLER") {
  //   return Response.redirect(new URL(SELLER_LOGIN_REDIRECT, nextUrl));
  // }

  // if (isRiderRoute && role !== "RIDER") {
  //   return Response.redirect(new URL(RIDER_LOGIN_REDIRECT, nextUrl));
  // }

  // 🔁 Redirect logged-in users away from "/" based on role
  if (pathname === "/" && isLoggedIn) {
    if (role === "ADMIN")
      return Response.redirect(new URL(ADMIN_LOGIN_REDIRECT, nextUrl));
    if (role === "SELLER")
      return Response.redirect(new URL(SELLER_LOGIN_REDIRECT, nextUrl));
    if (role === "RIDER")
      return Response.redirect(new URL(RIDER_LOGIN_REDIRECT, nextUrl));
  }

  console.log("✅ Access allowed\n");
  return;
});

export const config = {
  matcher: [
    "/((?!.+\\.[\\w]+$|_next|favicon.ico|public).*)",
    "/",
    "/(api|trpc)(.*)",
  ],
};
