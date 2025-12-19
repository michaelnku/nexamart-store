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
  moderatorRoutePrefix,
  sharedRoutes,
} from "@/routes";
import authConfig from "./auth.config";

const { auth: Middleware } = NextAuth(authConfig);

export default Middleware((req) => {
  const { nextUrl } = req;
  const pathname = nextUrl.pathname;
  const isLoggedIn = !!req.auth;
  const role = req.auth?.user.role;

  // const isPublicRoute = publicRoutes.includes(pathname);
  const isPublicRoute = publicRoutes.some(
    (route) => pathname === route || pathname.startsWith(route + "/")
  );
  const isAuthRoute = authRoutes.includes(pathname);
  const isApiAuthRoute = pathname.startsWith(apiAuthPrefix);

  const isModeratorRoute = pathname.startsWith(moderatorRoutePrefix);
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

  // ✅ Allow public currency API
  if (pathname.startsWith("/api/currency-rates")) {
    return;
  }

  // ✅ Skip all /api/auth/* routes
  if (isApiAuthRoute) {
    console.log("⏭ Skipping API Auth route\n");
    return;
  }

  // ✅ ALWAYS allow public routes
  if (isPublicRoute) {
    console.log("🌍 Public route → access allowed\n");
    return;
  }

  //shared routes
  if (isLoggedIn && sharedRoutes.some((route) => pathname.startsWith(route))) {
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
    return Response.redirect(new URL("/auth/login", nextUrl));
  }

  // 🚫 ROLE-BASED AUTHORIZATION (STRICT)
  if (isLoggedIn) {
    if (role === "USER") {
      if (pathname.startsWith("/market-place")) {
        return Response.redirect(new URL("/403", nextUrl));
      }
    }

    if (role === "ADMIN") {
      if (!isAdminRoute) {
        if (!pathname.startsWith("/market-place")) {
          return Response.redirect(new URL("/403", nextUrl));
        }
      }
    }

    if (role === "SELLER") {
      if (!isSellerRoute) {
        if (!pathname.startsWith("/market-place")) {
          return Response.redirect(new URL("/403", nextUrl));
        }
      }
    }

    if (role === "RIDER") {
      if (!isRiderRoute) {
        if (!pathname.startsWith("/market-place")) {
          return Response.redirect(new URL("/403", nextUrl));
        }
      }
    }

    if (role === "MODERATOR") {
      if (!isModeratorRoute) {
        if (!pathname.startsWith("/market-place")) {
          return Response.redirect(new URL("/403", nextUrl));
        }
      }
    }
  }

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
