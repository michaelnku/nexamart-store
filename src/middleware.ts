import { NextResponse } from "next/server";
import authConfig from "./auth.config";
import NextAuth from "next-auth";
import {
  getDashboardRedirectForRole,
  isStaffRole,
} from "@/lib/auth/roleRedirect";
import {
  publicRoutes,
  apiAuthPrefix,
  authRoutes,
  adminRoutePrefix,
  sellerRoutePrefix,
  riderRoutePrefix,
  moderatorRoutePrefix,
  sharedRoutes,
} from "@/routes";

const ROLE_PREFIX: Record<string, string> = {
  ADMIN: adminRoutePrefix,
  SELLER: sellerRoutePrefix,
  RIDER: riderRoutePrefix,
  MODERATOR: moderatorRoutePrefix,
};

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

  if (pathname === "/" && isLoggedIn && isStaffRole(role)) {
    const redirectTo = getDashboardRedirectForRole(role);
    if (redirectTo) {
      return NextResponse.redirect(new URL(redirectTo, nextUrl));
    }
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
    const redirectTo = getDashboardRedirectForRole(role);
    if (redirectTo) {
      return NextResponse.redirect(new URL(redirectTo, nextUrl));
    }
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
