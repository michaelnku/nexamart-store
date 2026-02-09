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
  MODERATOR_LOGIN_REDIRECT,
} from "@/routes";
import authConfig from "./auth.config";

const { auth: Middleware } = NextAuth(authConfig);

const ROLE_DASHBOARD: Record<string, string> = {
  ADMIN: ADMIN_LOGIN_REDIRECT,
  SELLER: SELLER_LOGIN_REDIRECT,
  RIDER: RIDER_LOGIN_REDIRECT,
  MODERATOR: MODERATOR_LOGIN_REDIRECT,
  USER: DEFAULT_LOGIN_REDIRECT,
};

const ROLE_PREFIX: Record<string, string> = {
  ADMIN: adminRoutePrefix,
  SELLER: sellerRoutePrefix,
  RIDER: riderRoutePrefix,
  MODERATOR: moderatorRoutePrefix,
};

const STAFF_ROLES = new Set(["ADMIN", "SELLER", "RIDER", "MODERATOR"]);

export default Middleware((req) => {
  const { nextUrl } = req;
  const pathname = nextUrl.pathname;

  const isLoggedIn = !!req.auth;
  const role = req.auth?.user.role;

  const isApiAuthRoute = pathname.startsWith(apiAuthPrefix);
  const isAuthRoute = authRoutes.includes(pathname);
  const isPublicRoute = publicRoutes.some(
    (route) => pathname === route || pathname.startsWith(route + "/"),
  );

  // Logged-in staff should never land on "/"
  if (pathname === "/" && isLoggedIn && role && STAFF_ROLES.has(role)) {
    return Response.redirect(new URL(ROLE_DASHBOARD[role], nextUrl));
  }

  if (pathname.startsWith("/api/currency-rates")) {
    return;
  }
  if (isApiAuthRoute) {
    console.log("⏭ Skipping API Auth route\n");
    return;
  }
  if (isPublicRoute) {
    console.log("🌍 Public route → access allowed\n");
    return;
  }

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

  //shared routes
  if (isLoggedIn && sharedRoutes.some((route) => pathname.startsWith(route))) {
    return;
  }

  //  If user is logged in and visits /login or /register → redirect to dashboard
  if (isAuthRoute && isLoggedIn && role) {
    return Response.redirect(new URL(ROLE_DASHBOARD[role], nextUrl));
  }

  //  If user is not logged in and visits a protected page → redirect to /login
  if (!isLoggedIn && !isPublicRoute && !isAuthRoute) {
    console.log("🚫 Not logged in → redirecting to /login\n");
    return Response.redirect(new URL("/auth/login", nextUrl));
  }

  //  ROLE-BASED AUTHORIZATION (STRICT)
  if (isLoggedIn && role) {
    // USER cannot access marketplace dashboards
    if (role === "USER" && pathname.startsWith("/marketplace")) {
      return Response.redirect(new URL("/403", nextUrl));
    }

    // Staff accessing wrong dashboard
    if (ROLE_PREFIX[role]) {
      const allowedPrefix = ROLE_PREFIX[role];

      if (
        !pathname.startsWith(allowedPrefix) &&
        !pathname.startsWith("/marketplace")
      ) {
        return Response.redirect(new URL("/403", nextUrl));
      }
    }
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
