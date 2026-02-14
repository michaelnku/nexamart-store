import { NextRequest, NextResponse } from "next/server";
import authConfig from "./auth.config";
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

const { auth: Middleware } = NextAuth(authConfig);

export default Middleware((req) => {
  const { nextUrl } = req;
  const pathname = nextUrl.pathname;

  const isLoggedIn = !!req.auth;
  const role = req.auth?.user.role;

  const isApiAuthRoute = pathname.startsWith(apiAuthPrefix);
  const isApiRoute = pathname.startsWith("/api");
  const isAuthRoute = authRoutes.includes(pathname);
  const isPublicRoute = publicRoutes.some(
    (route) => pathname === route || pathname.startsWith(route + "/"),
  );

  if (pathname === "/" && isLoggedIn && role && STAFF_ROLES.has(role)) {
    return NextResponse.redirect(new URL(ROLE_DASHBOARD[role], nextUrl));
  }

  if (pathname.startsWith("/api/currency-rates")) {
    return;
  }

  if (isApiAuthRoute) {
    return;
  }

  if (isApiRoute) {
    return;
  }

  if (isPublicRoute) {
    return;
  }

  if (isLoggedIn && sharedRoutes.some((route) => pathname.startsWith(route))) {
    return;
  }

  if (isAuthRoute && isLoggedIn && role) {
    return NextResponse.redirect(new URL(ROLE_DASHBOARD[role], nextUrl));
  }

  if (!isLoggedIn && !isPublicRoute && !isAuthRoute) {
    return NextResponse.redirect(new URL("/auth/login", nextUrl));
  }

  if (isLoggedIn && role) {
    if (role === "USER" && pathname.startsWith("/marketplace")) {
      return NextResponse.redirect(new URL("/403", nextUrl));
    }

    if (ROLE_PREFIX[role]) {
      const allowedPrefix = ROLE_PREFIX[role];

      if (
        !pathname.startsWith(allowedPrefix) &&
        !pathname.startsWith("/marketplace")
      ) {
        return NextResponse.redirect(new URL("/403", nextUrl));
      }
    }
  }

  return;
});

export const config = {
  matcher: [
    "/((?!.+\\.[\\w]+$|_next|favicon.ico|public).*)",
    "/",
    "/(api|trpc)(.*)",
  ],
};
