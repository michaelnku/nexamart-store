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
import { Input } from "@/components/ui/input";
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
import { useCurrentUserQuery } from "@/stores/useGetCurrentUserQuery";
import { VerifiedBadge } from "../market-place/BadgeCounts";
import { useDashboardEvents } from "@/hooks/useDashboardEvents";
import { UserDTO } from "@/lib/types";
import { ModeToggle } from "./ModeToggle";
import { MobileSideNav } from "@/app/market-place/_components/SideNavbar";
import DashboardPageSkeleton from "../skeletons/DashboardPageSkeleton";

type IconType = React.ComponentType<React.SVGProps<SVGSVGElement>>;

type QuickNavItem = {
  icon: IconType;
  label: string;
  href: string;
};

export default function MarketPlaceNavbar({
  initialUser,
}: {
  initialUser: UserDTO | null;
}) {
  const pathname = usePathname();
  const { data: user, isLoading, isError } = useCurrentUserQuery(initialUser);
  const [searchQuery, setSearchQuery] = useState("");
  const [hasNewAlert, setHasNewAlert] = useState(false);

  const [open, setOpen] = useState(false);

  if (isLoading) return <DashboardPageSkeleton />;
  if (isError) return null;

  if (!user) return null;

  const role = user.role;
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

  useDashboardEvents(user.id, user.role, setHasNewAlert);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
  };

  const sellerNav: QuickNavItem[] = [
    {
      icon: ShoppingBag,
      label: "Orders",
      href: "/market-place/dashboard/seller/orders",
    },
  ];

  const riderNav: QuickNavItem[] = [
    { icon: ShoppingBag, label: "Assigned Trips", href: "/dashboard/trips" },
    { icon: Bell, label: "Delivery Alerts", href: "/dashboard/notifications" },
  ];

  const adminNav: QuickNavItem[] = [
    { icon: FileChartColumn, label: "Reports", href: "/dashboard/reports" },
    { icon: MessageSquare, label: "Tickets", href: "/dashboard/tickets" },
  ];

  const moderatorNav: QuickNavItem[] = [
    {
      icon: FileChartColumn,
      label: "Moderation",
      href: "/market-place/dashboard/moderator/reports",
    },
  ];

  let quickNav: QuickNavItem[] = [];
  if (role === "SELLER") quickNav = sellerNav;
  if (role === "RIDER") quickNav = riderNav;
  if (role === "ADMIN") quickNav = adminNav;
  if (role === "MODERATOR") quickNav = moderatorNav;

  const isActive = (href: string) => pathname.startsWith(href);

  const logout = useLogout();

  return (
    <header className="sticky top-0 z-50 light:bg-white/90 backdrop-blur border-b shadow-sm">
      <div className="flex items-center justify-between h-16 px-4 md:px-8">
        {/* LEFT — LOGO + DASHBOARD TITLE */}
        <div className="flex items-center gap-3 cursor-pointer">
          <Link href="/" className="flex items-center gap-2">
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

        {/* CENTER — SEARCH BAR */}
        <div className="hidden md:flex flex-1 max-w-2xl mx-6">
          <form
            onSubmit={handleSearch}
            className="w-full flex items-center gap-2 pl-4 pr-1 py-[5px] border rounded-full shadow focus-within:ring-2 ring-[var(--brand-blue)]"
          >
            <Input
              type="search"
              placeholder="Search inventory, orders, customers..."
              className="border-none text-[15px] focus-visible:ring-0"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            <Button className="rounded-full bg-[var(--brand-blue)] hover:bg-[var(--brand-blue-hover)]">
              🔍
            </Button>
          </form>
        </div>

        {/* RIGHT — QUICK ICONS + ACCOUNT */}
        <div className="hidden md:flex items-center gap-7">
          {quickNav.map((item) => (
            <Link
              key={item.label}
              href={item.href}
              className={`relative text-sm font-medium transition flex flex-col items-center ${
                isActive(item.href)
                  ? "text-[var(--brand-blue)]"
                  : "text-gray-600 hover:text-[var(--brand-blue)]"
              }`}
            >
              <item.icon className="w-5 h-5" />
              <span className="text-[11px] hidden lg:block mt-[2px]">
                {item.label}
              </span>
            </Link>
          ))}

          <Link
            href={"/market-place/dashboard/seller/notifications"}
            className={`relative text-sm font-medium transition flex flex-col items-center ${
              isActive("/market-place/dashboard/seller/notifications")
                ? "text-[var(--brand-blue)]"
                : "text-gray-600 hover:text-[var(--brand-blue)]"
            }`}
          >
            <div className="relative">
              <Bell className="w-5 h-5" />
              {hasNewAlert && (
                <span className="absolute top-0 right-0 w-2 h-2 bg-red-500 rounded-full"></span>
              )}

              <span className="text-[11px] hidden lg:block mt-[2px]">
                alert
              </span>
            </div>
          </Link>

          {/* ACCOUNT DROPDOWN */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="flex items-center gap-2 hover:text-[var(--brand-blue)] transition">
                {user?.image ? (
                  <Image
                    src={user.image}
                    alt="User"
                    width={32}
                    height={32}
                    className="rounded-full object-cover"
                  />
                ) : (
                  <div className="w-9 h-9 rounded-full bg-gray-300 flex items-center justify-center">
                    <User className="w-5 h-5 text-gray-600" />
                  </div>
                )}
                <span className="hidden lg:block font-semibold">
                  {user
                    ? `Hi, ${user?.name?.split(" ")[0] || user.username}`
                    : "Account"}
                </span>
              </button>
            </DropdownMenuTrigger>

            <DropdownMenuContent align="end" className="w-64 py-2">
              <p className="px-4 pb-2 text-xs text-gray-500">{user?.email}</p>
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

        {/* MOBILE DRAWER */}
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

              {/* HEADER */}
              <div className="border-b p-5">
                <div className="flex items-start gap-4">
                  {user?.image ? (
                    <Image
                      src={user.image}
                      width={48}
                      height={48}
                      alt="avatar"
                      className="rounded-full object-cover border shadow-sm shrink-0"
                    />
                  ) : (
                    <div className="w-12 h-12 rounded-full bg-gray-200 flex items-center justify-center border shadow-sm shrink-0">
                      <User className="w-6 h-6 text-gray-600" />
                    </div>
                  )}

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-semibold text-[15px] truncate">
                        {user
                          ? `Hi, ${user.name?.split(" ")[0] || user.username}`
                          : "Welcome"}
                      </p>

                      <VerifiedBadge />
                    </div>

                    <p className="text-sm text-gray-500 truncate">
                      {user?.email}
                    </p>

                    {user?.role && (
                      <span className="inline-block mt-1 text-[10px] bg-[var(--brand-blue-light)] text-[var(--brand-blue)] px-2 py-[2px] rounded uppercase font-semibold">
                        {user.role}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Drawer Side Nav */}
              <div className="py-2 px-2">
                <MobileSideNav
                  initialUser={user ?? null}
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
              seg.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())
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
