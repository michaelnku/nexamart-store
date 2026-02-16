"use client";

import SiteNavbar from "@/components/layout/Navbar";
import MarketPlaceNavbar from "@/components/layout/MarketPlaceNavbar";
import { UserDTO } from "@/lib/types";

export default function SiteLayoutClient({ user }: { user: UserDTO | null }) {
  return (
    <>
      {(!user || user.role === "USER") && <SiteNavbar initialUser={user} />}

      {(user?.role === "SELLER" ||
        user?.role === "RIDER" ||
        user?.role === "ADMIN" ||
        user?.role === "MODERATOR") && <MarketPlaceNavbar initialUser={user} />}
    </>
  );
}
