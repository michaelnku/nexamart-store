"use client";

import SiteNavbar from "@/components/layout/Navbar";
import MarketPlaceNavbar from "@/components/layout/MarketPlaceNavbar";
import type { PublicSiteConfiguration } from "@/lib/site-config/siteConfig.types";
import { UserDTO } from "@/lib/types";

export default function SiteLayoutClient({
  user,
  siteConfig,
}: {
  user: UserDTO | null;
  siteConfig: PublicSiteConfiguration;
}) {
  return (
    <>
      {(!user || user.role === "USER") && (
        <SiteNavbar initialUser={user} siteConfig={siteConfig} />
      )}

      {(user?.role === "SELLER" ||
        user?.role === "RIDER" ||
        user?.role === "ADMIN" ||
        user?.role === "MODERATOR") && (
        <MarketPlaceNavbar initialUser={user} siteConfig={siteConfig} />
      )}
    </>
  );
}
