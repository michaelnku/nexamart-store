import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
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

export default async function middleware(req: NextRequest) {
  const { nextUrl } = req;
  const pathname = nextUrl.pathname;

  const token = await getToken({
    req,
    secret: process.env.AUTH_SECRET ?? process.env.NEXTAUTH_SECRET,
  });

  const isLoggedIn = !!token;
  const role = token?.role as string | undefined;

  const isApiAuthRoute = pathname.startsWith(apiAuthPrefix);
  const isApiRoute = pathname.startsWith("/api");
  const isAuthRoute = authRoutes.includes(pathname);
  const isPublicRoute = publicRoutes.some(
    (route) => pathname === route || pathname.startsWith(route + "/"),
  );

  // Logged-in staff should never land on "/"
  if (pathname === "/" && isLoggedIn && role && STAFF_ROLES.has(role)) {
    return NextResponse.redirect(new URL(ROLE_DASHBOARD[role], nextUrl));
  }

  if (pathname.startsWith("/api/currency-rates")) {
    return;
  }

  if (isApiAuthRoute) {
    return;
  }

  // Let API handlers manage their own auth/authorization responses.
  if (isApiRoute) {
    return;
  }

  if (isPublicRoute) {
    return;
  }

  // shared routes
  if (isLoggedIn && sharedRoutes.some((route) => pathname.startsWith(route))) {
    return;
  }

  // If user is logged in and visits auth pages -> redirect to dashboard
  if (isAuthRoute && isLoggedIn && role) {
    return NextResponse.redirect(new URL(ROLE_DASHBOARD[role], nextUrl));
  }

  // If user is not logged in and visits a protected page -> redirect to login
  if (!isLoggedIn && !isPublicRoute && !isAuthRoute) {
    return NextResponse.redirect(new URL("/auth/login", nextUrl));
  }

  // Role-based authorization
  if (isLoggedIn && role) {
    // USER cannot access marketplace dashboards
    if (role === "USER" && pathname.startsWith("/marketplace")) {
      return NextResponse.redirect(new URL("/403", nextUrl));
    }

    // Staff accessing wrong dashboard
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
}

export const config = {
  matcher: [
    "/((?!.+\\.[\\w]+$|_next|favicon.ico|public).*)",
    "/",
    "/(api|trpc)(.*)",
  ],
};
