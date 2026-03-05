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
import { VerifiedBadge } from "../marketplace/BadgeCounts";
import { useDashboardEvents } from "@/hooks/useDashboardEvents";
import { UserDTO } from "@/lib/types";
import { ModeToggle } from "./ModeToggle";
import { MobileSideNav } from "@/components/layout/SideNavbar";
import DashboardPageSkeleton from "../skeletons/DashboardPageSkeleton";
import { MarketplaceSearch } from "../search/MarketplaceSearch";
import { MobileSearchSheet } from "../search/MobileSearchSheet";
import { getUserInitials } from "@/lib/user";
import RiderTripsDropdown from "@/components/layout/RiderTripsDropdown";
import CurrencySelector from "@/components/currency/CurrencySelector";

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
  const pathname = usePathname() ?? "";
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
      href: "/marketplace/dashboard/admin/support",
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

  const isActivePath = (href: string) => {
    const p = pathname.replace(/\/$/, "");
    const h = href.replace(/\/$/, "");
    return p === h || p.startsWith(`${h}/`);
  };

  const getHomePath = (userRole?: string) => {
    switch (userRole) {
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
  const accountSettingsHref = "/settings";
  const walletHref =
    role === "SELLER"
      ? "/marketplace/dashboard/seller/wallet"
      : role === "RIDER"
        ? "/marketplace/dashboard/rider/wallet"
        : null;
  const supportHref =
    role === "SELLER"
      ? "/marketplace/dashboard/seller/support"
      : role === "RIDER"
        ? "/marketplace/dashboard/rider/support"
        : role === "ADMIN"
          ? "/marketplace/dashboard/admin/support"
          : null;

  const dashboardHomePath = getHomePath(currentUser?.role);

  const breadcrumbItems = (() => {
    const toLabel = (segment: string) =>
      segment.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());

    if (pathname.startsWith("/marketplace/dashboard")) {
      const segments = pathname.split("/").filter(Boolean);
      const roleSegment = segments[2];
      if (!roleSegment) return [];

      const dynamicParts = segments.slice(3);
      const basePath = `/marketplace/dashboard/${roleSegment}`;
      const labels = [dashboardTitle ?? "Dashboard", ...dynamicParts.map(toLabel)];

      let runningPath = basePath;
      const paths = labels.map((_, index) => {
        if (index === 0) return basePath;
        runningPath += `/${dynamicParts[index - 1]}`;
        return runningPath;
      });

      return labels.map((label, index) => ({
        label,
        href: paths[index],
        isLast: index === labels.length - 1,
      }));
    }

    if (pathname.startsWith("/settings")) {
      const segments = pathname.split("/").filter(Boolean).slice(1);
      const labels = [
        dashboardTitle ?? "Dashboard",
        "Settings",
        ...segments.map(toLabel),
      ];

      let runningPath = "/settings";
      const paths = labels.map((_, index) => {
        if (index === 0) return dashboardHomePath;
        if (index === 1) return "/settings";
        runningPath += `/${segments[index - 2]}`;
        return runningPath;
      });

      return labels.map((label, index) => ({
        label,
        href: paths[index],
        isLast: index === labels.length - 1,
      }));
    }

    if (pathname.startsWith("/profile")) {
      const segments = pathname.split("/").filter(Boolean).slice(1);
      const labels = [
        dashboardTitle ?? "Dashboard",
        "Profile",
        ...segments.map(toLabel),
      ];

      let runningPath = "/profile";
      const paths = labels.map((_, index) => {
        if (index === 0) return dashboardHomePath;
        if (index === 1) return "/profile";
        runningPath += `/${segments[index - 2]}`;
        return runningPath;
      });

      return labels.map((label, index) => ({
        label,
        href: paths[index],
        isLast: index === labels.length - 1,
      }));
    }

    return [];
  })();

  return (
    <header className="sticky top-0 z-50 border-b shadow-sm backdrop-blur light:bg-white/90">
      <div className="flex h-14 items-center justify-between gap-2 px-3 sm:h-16 sm:px-4 lg:px-6 xl:px-8">
        <div className="flex min-w-0 items-center gap-2 sm:gap-3">
          <Link
            href={getHomePath(currentUser?.role)}
            className="flex shrink-0 items-center gap-2"
          >
            <Image
              src="https://ijucjait38.ufs.sh/f/rO7LkXAj4RVlnNw2KuOByscQRmqV3jX4rStz8G2Mv0IpxKJA"
              alt="NexaMart Logo"
              width={42}
              height={42}
              className="object-contain"
            />
          </Link>

          <div className="hidden min-w-0 flex-col leading-tight sm:flex">
            <span className="truncate text-base font-semibold tracking-tight lg:text-[18px]">
              {dashboardTitle}
            </span>
            <span className="inline-flex w-fit rounded bg-[var(--brand-blue-light)] px-2 py-[2px] text-xs font-semibold text-[var(--brand-blue)]">
              {role}
            </span>
          </div>
        </div>

        <div className="hidden min-w-0 flex-1 lg:mx-3 lg:flex lg:max-w-xl xl:mx-6 xl:max-w-2xl">
          <MarketplaceSearch />
        </div>

        <div className="flex items-center gap-2 lg:hidden">
          <MobileSearchSheet variant="marketplace" />
        </div>

        <div className="hidden items-center gap-3 lg:flex xl:gap-5">
              {quickNav.map((item) => {
                const active = item.onClick
                  ? (item.isActive?.() ?? false)
                  : item.href
                    ? isActivePath(item.href)
                    : false;
            const className = `relative flex flex-col items-center text-sm font-medium transition dark:text-gray-400 ${
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
                  <item.icon className="h-5 w-5" />
                  <span className="mt-[2px] hidden text-[11px] xl:block">
                    {item.label}
                  </span>
                </button>
              );
            }

            return item.href ? (
              <Link key={item.label} href={item.href} className={className}>
                <item.icon className="h-5 w-5" />
                <span className="mt-[2px] hidden text-[11px] xl:block">
                  {item.label}
                </span>
              </Link>
            ) : null;
          })}

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="flex items-center gap-2 transition hover:text-[var(--brand-blue)]">
                {currentUser?.image ? (
                  <Image
                    src={currentUser.image}
                    alt="User"
                    width={32}
                    height={32}
                    className="rounded-full object-cover"
                  />
                ) : (
                  <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gray-300">
                    <span className="text-xs font-semibold text-gray-700">
                      {getUserInitials(currentUser)}
                    </span>
                  </div>
                )}
                <span className="hidden font-semibold xl:block text-gray-700 dark:text-gray-400">
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
                  href={accountSettingsHref}
                  className="flex gap-2"
                  onClick={() => setOpen(false)}
                >
                  <User className="h-4 w-4" /> Account Settings
                </Link>
              </DropdownMenuItem>

              {walletHref && (
                <DropdownMenuItem asChild>
                  <Link
                    href={walletHref}
                    className="flex gap-2"
                    onClick={() => setOpen(false)}
                  >
                    <Wallet className="h-4 w-4" /> Wallet
                  </Link>
                </DropdownMenuItem>
              )}

              {supportHref && (
                <DropdownMenuItem asChild>
                  <Link
                    href={supportHref}
                    className="flex gap-2"
                    onClick={() => setOpen(false)}
                  >
                    <HelpCircle className="h-4 w-4" /> Support Center
                  </Link>
                </DropdownMenuItem>
              )}

              <DropdownMenuSeparator />

              <DropdownMenuItem>
                <Button
                  variant="ghost"
                  className="flex w-full gap-2 text-red-500 hover:text-red-600"
                  onClick={() => {
                    logout();
                    setOpen(false);
                  }}
                >
                  <LogOut className="h-4 w-4" /> Logout
                </Button>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <div className="hidden xl:block">
            <CurrencySelector />
          </div>
          <ModeToggle />
        </div>

        <div className="flex items-center gap-1 sm:gap-2 lg:hidden">
          <ModeToggle />

          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-9 w-9 sm:h-10 sm:w-10"
              >
                <Menu className="h-6 w-6" />
              </Button>
            </SheetTrigger>

            <SheetContent side="right" className="w-80 overflow-y-auto p-0">
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
                      className="shrink-0 rounded-full border object-cover shadow-sm"
                    />
                  ) : (
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full border bg-gray-200 shadow-sm">
                      <span className="text-sm font-semibold text-gray-700">
                        {getUserInitials(currentUser)}
                      </span>
                    </div>
                  )}

                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="truncate text-[15px] font-semibold">
                        {currentUser
                          ? `Hi, ${currentUser?.name?.split(" ")[0] || currentUser?.username}`
                          : "Welcome"}
                      </p>

                      <VerifiedBadge user={currentUser ?? undefined} />
                    </div>

                    <p className="truncate text-sm text-gray-500">
                      {currentUser?.email}
                    </p>

                    {currentUser?.role && (
                      <span className="mt-1 inline-block rounded bg-[var(--brand-blue-light)] px-2 py-[2px] text-[10px] font-semibold uppercase text-[var(--brand-blue)]">
                        {currentUser.role}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <div className="px-2 py-2">
                <MobileSideNav
                  initialUser={currentUser ?? null}
                  onNavigate={() => setOpen(false)}
                />
              </div>

              <Separator />
              <div className="flex items-center justify-between gap-3 p-5">
                <span className="text-sm text-gray-600">Currency</span>
                <CurrencySelector />
              </div>

              <Separator />
              <div className="p-5">
                <Button
                  variant="destructive"
                  className="flex w-full gap-2"
                  onClick={() => {
                    logout();
                    setOpen(false);
                  }}
                >
                  <LogOut className="h-4 w-4" /> Logout
                </Button>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>

      <div className="w-full border-t light:bg-white">
        <div className="flex items-center gap-2 overflow-x-auto whitespace-nowrap px-3 py-2 text-sm sm:px-4 lg:px-6 xl:px-8">
          {breadcrumbItems.map((item, index) => (
            <div key={`${item.href}-${index}`} className="flex items-center gap-2">
              {item.isLast ? (
                <span className="font-semibold text-[var(--brand-blue)]">
                  {item.label}
                </span>
              ) : (
                <Link
                  href={item.href}
                  className="text-gray-600 transition hover:text-[var(--brand-blue)]"
                >
                  {item.label}
                </Link>
              )}

              {!item.isLast && <span className="text-gray-400">{">"}</span>}
            </div>
          ))}
        </div>
      </div>
    </header>
  );
}
