"use client";

import Link from "next/link";
import Image from "next/image";
import { useState } from "react";
import { usePathname } from "next/navigation";
import {
  User,
  HelpCircle,
  LogOut,
  Bell,
  MessageSquare,
  ShoppingBag,
  Menu,
  Wallet,
  FileChartColumn,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { Sheet, SheetTrigger, SheetContent } from "@/components/ui/sheet";
import { VisuallyHidden } from "@radix-ui/react-visually-hidden";
import { DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Separator } from "../ui/separator";
import { useLogout } from "@/hooks/useLogout";
import { useCurrentUserQuery } from "@/stores/useCurrentUserQuery";
import { VerifiedBadge } from "../market-place/BadgeCounts";
import { useDashboardEvents } from "@/hooks/useDashboardEvents";
import { UserDTO } from "@/lib/types";
import { ModeToggle } from "./ModeToggle";
import { MobileSideNav } from "@/components/layout/SideNavbar";
import DashboardPageSkeleton from "../skeletons/DashboardPageSkeleton";
import { MarketplaceSearch } from "../search/MarketplaceSearch";
import { MobileSearchSheet } from "../search/MobileSearchSheet";
import { getUserInitials } from "@/lib/user";
import RiderTripsDropdown from "@/components/layout/RiderTripsDropdown";

type IconType = React.ComponentType<React.SVGProps<SVGSVGElement>>;

type QuickNavItem = {
  icon: IconType;
  label: string;
  href?: string;
  onClick?: () => void;
  isActive?: () => boolean;
};

export default function MarketPlaceNavbar({
  initialUser,
}: {
  initialUser: UserDTO | null;
}) {
  const pathname = usePathname();
  const { data: user, isLoading, isError } = useCurrentUserQuery(initialUser);
  const currentUser = user ?? initialUser;
  const [hasNewAlert, setHasNewAlert] = useState(false);

  const [open, setOpen] = useState(false);

  useDashboardEvents(currentUser?.id, currentUser?.role, setHasNewAlert);
  const logout = useLogout();

  if (isLoading && !currentUser) return <DashboardPageSkeleton />;
  if (isError && !currentUser) return null;

  const role = currentUser?.role;
  const dashboardTitle =
    role === "SELLER"
      ? "Seller Center"
      : role === "RIDER"
        ? "Rider Hub"
        : role === "ADMIN"
          ? "Admin Console"
          : role === "MODERATOR"
            ? "Moderator Panel"
            : null;

  if (!role || role === "USER") {
    return null;
  }

  const sellerNav: QuickNavItem[] = [
    {
      icon: ShoppingBag,
      label: "Orders",
      href: "/marketplace/dashboard/seller/orders",
    },
  ];

  const riderNav: QuickNavItem[] = [
    {
      icon: ShoppingBag,
      label: "Assigned Trips",
      onClick: undefined,
      isActive: () => pathname.startsWith("/marketplace/dashboard/rider/trips"),
    },
    {
      icon: Bell,
      label: "Delivery Alerts",
      href: "/marketplace/dashboard/rider/notifications",
    },
  ];

  const adminNav: QuickNavItem[] = [
    {
      icon: FileChartColumn,
      label: "Reports",
      href: "/marketplace/dashboard/admin/reports",
    },
    {
      icon: MessageSquare,
      label: "Tickets",
      href: "/marketplace/dashboard/admin/tickets",
    },
  ];

  const moderatorNav: QuickNavItem[] = [
    {
      icon: FileChartColumn,
      label: "Moderation",
      href: "/marketplace/dashboard/moderator/reports",
    },
  ];

  let quickNav: QuickNavItem[] = [];
  if (role === "SELLER") quickNav = sellerNav;
  if (role === "RIDER") quickNav = riderNav;
  if (role === "ADMIN") quickNav = adminNav;
  if (role === "MODERATOR") quickNav = moderatorNav;

  const isActive = (href: string) => pathname.startsWith(href);

  const getHomePath = (role?: string) => {
    switch (role) {
      case "MODERATOR":
        return "/marketplace/dashboard/moderator";
      case "ADMIN":
        return "/marketplace/dashboard/admin";
      case "SELLER":
        return "/marketplace/dashboard/seller";
      case "RIDER":
        return "/marketplace/dashboard/rider";
      default:
        return "/";
    }
  };

  const avatarUrl = currentUser?.image || currentUser?.profileAvatar?.url;

  return (
    <header className="sticky top-0 z-50 light:bg-white/90 backdrop-blur border-b shadow-sm">
      <div className="flex items-center justify-between h-16 px-4 md:px-8">
        <div className="flex items-center gap-3 cursor-pointer">
          <Link
            href={getHomePath(currentUser?.role)}
            className="flex items-center gap-2"
          >
            <Image
              src="https://ijucjait38.ufs.sh/f/rO7LkXAj4RVlnNw2KuOByscQRmqV3jX4rStz8G2Mv0IpxKJA"
              alt="NexaMart Logo"
              width={42}
              height={42}
              className="object-contain"
            />
          </Link>
          <div className="flex flex-col leading-tight">
            <span className="font-semibold text-[18px] tracking-tight">
              {dashboardTitle}
            </span>
            <span className="text-xs bg-[var(--brand-blue-light)] text-[var(--brand-blue)] font-semibold px-2 py-[2px] rounded">
              {role}
            </span>
          </div>
        </div>

        <div className="hidden md:flex flex-1 max-w-2xl mx-6">
          <MarketplaceSearch />
        </div>
        <div className="flex md:hidden items-center gap-2">
          <MobileSearchSheet variant="marketplace" />
        </div>

        <div className="hidden md:flex items-center gap-7">
          {quickNav.map((item) => {
            const active = item.onClick
              ? (item.isActive?.() ?? false)
              : item.href
                ? isActive(item.href)
                : false;
            const className = `relative text-sm font-medium transition flex flex-col items-center ${
              active
                ? "text-[var(--brand-blue)]"
                : "text-gray-600 hover:text-[var(--brand-blue)]"
            }`;

            if (role === "RIDER" && item.label === "Assigned Trips") {
              return (
                <RiderTripsDropdown
                  key={item.label}
                  className={className}
                  isActive={active}
                  Icon={item.icon}
                  label={item.label}
                />
              );
            }

            if (item.onClick) {
              return (
                <button
                  key={item.label}
                  type="button"
                  onClick={item.onClick}
                  className={className}
                >
                  <item.icon className="w-5 h-5" />
                  <span className="text-[11px] hidden lg:block mt-[2px]">
                    {item.label}
                  </span>
                </button>
              );
            }

            return item.href ? (
              <Link key={item.label} href={item.href} className={className}>
                <item.icon className="w-5 h-5" />
                <span className="text-[11px] hidden lg:block mt-[2px]">
                  {item.label}
                </span>
              </Link>
            ) : null;
          })}

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="flex items-center gap-2 hover:text-[var(--brand-blue)] transition">
                {currentUser?.image ? (
                  <Image
                    src={currentUser.image}
                    alt="User"
                    width={32}
                    height={32}
                    className="rounded-full object-cover"
                  />
                ) : (
                  <div className="w-9 h-9 rounded-full bg-gray-300 flex items-center justify-center">
                    <span className="text-xs font-semibold text-gray-700">
                      {getUserInitials(currentUser)}
                    </span>
                  </div>
                )}
                <span className="hidden lg:block font-semibold">
                  {currentUser
                    ? `Hi, ${currentUser?.name?.split(" ")[0] || currentUser.username}`
                    : "Account"}
                </span>
              </button>
            </DropdownMenuTrigger>

            <DropdownMenuContent align="end" className="w-64 py-2">
              <p className="px-4 pb-2 text-xs text-gray-500">
                {currentUser?.email}
              </p>
              <DropdownMenuSeparator />

              <DropdownMenuItem asChild>
                <Link
                  href="/dashboard/account"
                  className="flex gap-2"
                  onClick={() => {
                    setOpen(false);
                  }}
                >
                  <User className="w-4 h-4" /> Account Settings
                </Link>
              </DropdownMenuItem>

              <DropdownMenuItem asChild>
                <Link
                  href="/dashboard/wallet"
                  className="flex gap-2"
                  onClick={() => {
                    setOpen(false);
                  }}
                >
                  <Wallet className="w-4 h-4" /> Wallet
                </Link>
              </DropdownMenuItem>

              <DropdownMenuItem asChild>
                <Link
                  href="/dashboard/support"
                  className="flex gap-2"
                  onClick={() => {
                    setOpen(false);
                  }}
                >
                  <HelpCircle className="w-4 h-4" /> Support Center
                </Link>
              </DropdownMenuItem>

              <DropdownMenuSeparator />

              <DropdownMenuItem>
                <Button
                  variant="ghost"
                  className="w-full flex gap-2 text-red-500 hover:text-red-600"
                  onClick={() => {
                    logout();
                    setOpen(false);
                  }}
                >
                  <LogOut className="w-4 h-4" /> Logout
                </Button>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <ModeToggle />
        </div>

        <div className="flex md:hidden items-center gap-2">
          <ModeToggle />

          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon">
                <Menu className="w-6 h-6" />
              </Button>
            </SheetTrigger>

            <SheetContent side="right" className="w-80 p-0 overflow-y-auto">
              <DialogHeader>
                <VisuallyHidden>
                  <DialogTitle>Menu</DialogTitle>
                </VisuallyHidden>
              </DialogHeader>

              <div className="border-b p-5">
                <div className="flex items-start gap-4">
                  {avatarUrl ? (
                    <Image
                      src={avatarUrl}
                      width={48}
                      height={48}
                      alt="avatar"
                      className="rounded-full object-cover border shadow-sm shrink-0"
                    />
                  ) : (
                    <div className="w-12 h-12 rounded-full bg-gray-200 flex items-center justify-center border shadow-sm shrink-0">
                      <span className="text-sm font-semibold text-gray-700">
                        {getUserInitials(currentUser)}
                      </span>
                    </div>
                  )}

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-semibold text-[15px] truncate">
                        {currentUser
                          ? `Hi, ${currentUser?.name?.split(" ")[0] || currentUser?.username}`
                          : "Welcome"}
                      </p>

                      <VerifiedBadge />
                    </div>

                    <p className="text-sm text-gray-500 truncate">
                      {currentUser?.email}
                    </p>

                    {currentUser?.role && (
                      <span className="inline-block mt-1 text-[10px] bg-[var(--brand-blue-light)] text-[var(--brand-blue)] px-2 py-[2px] rounded uppercase font-semibold">
                        {currentUser.role}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Drawer Side Nav */}
              <div className="py-2 px-2">
                <MobileSideNav
                  initialUser={currentUser ?? null}
                  onNavigate={() => setOpen(false)}
                />
              </div>

              <Separator />
              <div className="p-5">
                <Button
                  variant="destructive"
                  className="w-full flex gap-2"
                  onClick={() => {
                    logout();
                    setOpen(false);
                  }}
                >
                  <LogOut className="w-4 h-4" /> Logout
                </Button>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>

      {/* ─────────────────── CLICKABLE BREADCRUMB ─────────────────── */}
      <div className="w-full border-t light:bg-white">
        <div className="px-4 md:px-8 py-2 flex items-center gap-2 text-sm overflow-x-auto whitespace-nowrap">
          {(() => {
            const segments = pathname.split("/").filter(Boolean);
            const dynamicParts = segments.slice(2);

            if (!pathname.startsWith("/market-place/dashboard")) return null;

            const readable = dynamicParts.map((seg) =>
              seg.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()),
            );

            const crumbs = [dashboardTitle, ...readable];

            // Build URLs progressively -> each crumb points to its parent level
            let linkPath = "/market-place/dashboard";
            const paths = crumbs.map((_, i) => {
              if (i === 0) return linkPath;
              linkPath += "/" + dynamicParts[i - 1];
              return linkPath;
            });

            return crumbs.map((item, index) => {
              const isLast = index === crumbs.length - 1;
              const href = paths[index];

              return (
                <div key={index} className="flex items-center gap-2">
                  {isLast ? (
                    <span className="font-semibold text-[var(--brand-blue)]">
                      {item}
                    </span>
                  ) : (
                    <Link
                      href={href}
                      className="text-gray-600 hover:text-[var(--brand-blue)] transition"
                    >
                      {item}
                    </Link>
                  )}

                  {!isLast && <span className="text-gray-400">›</span>}
                </div>
              );
            });
          })()}
        </div>
      </div>
    </header>
  );
}
