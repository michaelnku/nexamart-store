"use client";

import { User, LogOut, ChevronDown, ChevronRight } from "lucide-react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import Image from "next/image";
import { cn } from "@/lib/utils";
import { DashboardMenu } from "@/constants/dashboard-menu";
import { useCurrentUserQuery } from "@/stores/useCurrentUserQuery";
import { UserDTO } from "@/lib/types";
import { useLogout } from "@/hooks/useLogout";
import { VerifiedBadge } from "@/components/market-place/BadgeCounts";

/* --------------------- SHARED SIDEBAR COMPONENT --------------------- */

function SidebarContent({
  user,
  pathname,
  isMobile,
  onNavigate,
}: {
  user: UserDTO | null | undefined;
  pathname: string;
  isMobile?: boolean;
  onNavigate?: () => void;
}) {
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({});
  const role = user?.role as "SELLER" | "RIDER" | "ADMIN" | "MODERATOR";
  const menu = DashboardMenu[role] || [];

  const toggle = (title: string) =>
    setOpenSections((prev) => ({ ...prev, [title]: !prev[title] }));

  const isActive = (href: string) => {
    const p = pathname.replace(/\/$/, "");
    const h = href.replace(/\/$/, "");
    return p === h;
  };

  const logout = useLogout();

  return (
    <div
      className={cn(
        "flex flex-col h-full w-full relative",
        isMobile && "px-5 dark:bg-neutral-950",
      )}
    >
      <h2 className="text-[13px] font-semibold text-gray-500 px-4 pt-5 pb-4 uppercase">
        Menu
      </h2>

      {/* NAVIGATION */}
      <div className="flex-1 overflow-y-auto py-6 space-y-4">
        {menu.map((section) => (
          <div key={section.title}>
            <button
              onClick={() => toggle(section.title)}
              className="flex justify-between items-center w-full px-4 py-2 text-xs font-semibold uppercase tracking-wide text-gray-500 hover:text-black dark:hover:text-gray-600"
            >
              {section.title}
              {openSections[section.title] ? (
                <ChevronDown className="w-4 h-4" />
              ) : (
                <ChevronRight className="w-4 h-4" />
              )}
            </button>

            <div
              className={cn(
                "ml-1 mt-1 space-y-1 overflow-hidden transition-all",
                openSections[section.title] ? "max-h-96" : "max-h-0",
              )}
            >
              {section.links.map((link) => {
                const Icon = link.icon;
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    className={cn(
                      "flex items-center gap-3 px-5 py-2 rounded-md text-sm transition",
                      isActive(link.href)
                        ? "bg-[var(--brand-blue-light)] text-[var(--brand-blue)] border-l-4 border-[var(--brand-blue)] font-semibold"
                        : "text-gray-600 hover:bg-gray-100 hover:text-black",
                    )}
                    onClick={() => {
                      onNavigate?.();
                    }}
                  >
                    <Icon className="w-5 h-5" />
                    {link.name}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* BOTTOM — PROFILE & LOGOUT */}
      <div className={cn("w-full", isMobile && "hidden")}>
        <Separator />
        <div className="px-4 py-5 space-y-4">
          <div className="flex items-center gap-3">
            {user?.image ? (
              <Image
                src={user.image}
                width={42}
                height={42}
                alt="avatar"
                className="rounded-full object-cover"
              />
            ) : (
              <div className="w-10 h-10 rounded-full bg-gray-300 flex items-center justify-center">
                <User className="w-5 h-5 text-gray-600" />
              </div>
            )}

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <p className="font-semibold text-[15px] truncate">
                  {user?.name || user?.username || "My Account"}
                </p>

                <VerifiedBadge />
              </div>

              <p className="text-sm text-gray-500 truncate">{user?.email}</p>

              {user?.role && (
                <span className="inline-block mt-1 text-[10px] bg-[var(--brand-blue-light)] text-[var(--brand-blue)] px-2 py-[2px] rounded uppercase font-semibold">
                  {user.role}
                </span>
              )}
            </div>
          </div>

          <Button
            variant="outline"
            className="w-full flex gap-2 text-red-500 hover:text-red-600"
            onClick={() => {
              logout();
              onNavigate?.();
            }}
          >
            <LogOut className="w-4 h-4" /> Logout
          </Button>
        </div>
      </div>
    </div>
  );
}

/* ----------------------- DESKTOP SIDEBAR ----------------------- */

export const DashboardSidebar = ({
  initialUser,
}: {
  initialUser: UserDTO | null;
}) => {
  const { data: user } = useCurrentUserQuery(initialUser);
  const pathname = usePathname();

  return (
    <aside className="hidden md:flex fixed top-20 left-0 min-h-screen w-64 dark:bg-neutral-950 bg-white border-r shadow-sm z-20">
      <SidebarContent user={user} pathname={pathname} />
    </aside>
  );
};

/* ----------------------- MOBILE SIDEBAR ----------------------- */

export const MobileSideNav = ({
  initialUser,
  onNavigate,
}: {
  initialUser: UserDTO | null;
  onNavigate?: () => void;
}) => {
  const { data: user } = useCurrentUserQuery(initialUser);
  const pathname = usePathname();

  return (
    <SidebarContent
      user={user}
      pathname={pathname}
      isMobile
      onNavigate={onNavigate}
    />
  );
};
