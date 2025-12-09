"use client";

import {
  Bell,
  User,
  LogOut,
  LayoutDashboard,
  Settings,
  Menu,
  Package,
  Home,
  ShoppingBag,
  BarChart2,
  HelpCircle,
  Bike,
  DollarSign,
  Clock,
  Users,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { ModeToggle } from "@/components/layout/ModeToggle";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Sheet,
  SheetContent,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import Link from "next/link";
import { signOut } from "next-auth/react";
import Image from "next/image";
import { useCurrentUser } from "@/hooks/getCurrentUser";

const buyerLinks = [
  { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { name: "Orders", href: "/dashboard/orders", icon: LayoutDashboard },
  { name: "Products", href: "/dashboard/products", icon: LayoutDashboard },
  { name: "Settings", href: "/dashboard/settings", icon: Settings },
];

const sellerLinks = [
  { name: "Dashboard", href: "/market-place/dashboard/seller", icon: Home },
  {
    name: "My Products",
    href: "/market-place/dashboard/seller/products",
    icon: Package,
  },
  {
    name: "Orders",
    href: "/market-place/dashboard/seller/orders",
    icon: ShoppingBag,
  },
  {
    name: "Analytics",
    href: "/market-place/dashboard/seller/analytics",
    icon: BarChart2,
  },
  {
    name: "Settings",
    href: "/market-place/dashboard/seller/settings",
    icon: Settings,
  },
  {
    name: "Support",
    href: "/market-place/dashboard/seller/support",
    icon: HelpCircle,
  },
];

const riderLinks = [
  { name: "Dashboard", href: "/market-place/dashboard/seller", icon: Home },
  { name: "Deliveries", href: "/rider/deliveries", icon: Bike },
  { name: "Earnings", href: "/rider/earnings", icon: DollarSign },
  { name: "Schedule", href: "/rider/schedule", icon: Clock },
  { name: "Support", href: "/rider/support", icon: HelpCircle },
];

const adminLinks = [
  { name: "Dashboard", href: "/admin/dashboard", icon: BarChart2 },
  { name: "Manage Users", href: "/admin/users", icon: Users },
  { name: "Products", href: "/admin/products", icon: Package },
  { name: "Reports", href: "/admin/reports", icon: BarChart2 },
  { name: "Settings", href: "/admin/settings", icon: Settings },
];

export default function DashboardNavbar() {
  const user = useCurrentUser();

  return (
    <div>
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex flex-col w-64 bg-background border-r border-border fixed top-0 left-0 bottom-0 pt-3 z-20">
        <Link href={"/"} className="font-bold px-4 text-3xl">
          Nexamart
        </Link>

        <nav className="flex flex-col mt-3 space-y-2">
          {user?.role === "USER" &&
            buyerLinks.map((link) => (
              <Link
                key={link.name}
                href={link.href}
                className="flex items-center gap-2 px-4 py-2 text-sm font-medium hover:bg-primary/10 hover:text-primary transition-colors rounded-md"
              >
                <link.icon className="w-4 h-4" />
                {link.name}
              </Link>
            ))}
          {user?.role === "SELLER" &&
            sellerLinks.map((link) => (
              <Link
                key={link.name}
                href={link.href}
                className="flex items-center gap-2 px-4 py-2 text-sm font-medium hover:bg-primary/10 hover:text-primary transition-colors rounded-md"
              >
                <link.icon className="w-4 h-4" />
                {link.name}
              </Link>
            ))}
          {user?.role === "RIDER" &&
            riderLinks.map((link) => (
              <Link
                key={link.name}
                href={link.href}
                className="flex items-center gap-2 px-4 py-2 text-sm font-medium hover:bg-primary/10 hover:text-primary transition-colors rounded-md"
              >
                <link.icon className="w-4 h-4" />
                {link.name}
              </Link>
            ))}
          {user?.role === "ADMIN" &&
            adminLinks.map((link) => (
              <Link
                key={link.name}
                href={link.href}
                className="flex items-center gap-2 px-4 py-2 text-sm font-medium hover:bg-primary/10 hover:text-primary transition-colors rounded-md"
              >
                <link.icon className="w-4 h-4" />
                {link.name}
              </Link>
            ))}
          <button
            onClick={() => signOut({ callbackUrl: "/" })}
            className="flex items-center gap-2 mt-4 px-4 py-2 text-sm font-medium text-red-500 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors"
          >
            <LogOut className="w-4 h-4" /> Logout
          </button>
        </nav>
      </aside>

      {/* Topbar */}
      <header className="fixed top-0 left-0 right-0 md:left-64 h-16 bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b border-border flex items-center justify-between px-4 md:px-6 z-30">
        <div className="flex items-center gap-3">
          {/* Mobile Sidebar */}
          <div className="md:hidden">
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon">
                  <Menu className="w-5 h-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-64">
                <SheetTitle className="text-lg font-semibold px-4 py-2">
                  <Link href={"/"}>Nexamart</Link>
                </SheetTitle>
                <nav className="mt-3 flex flex-col gap-4 text-base font-medium">
                  {user?.role === "USER" &&
                    buyerLinks.map((link) => (
                      <Link
                        key={link.name}
                        href={link.href}
                        className="flex items-center gap-2 px-4 py-2 text-sm font-medium hover:bg-primary/10 hover:text-primary transition-colors rounded-md"
                      >
                        <link.icon className="w-4 h-4" />
                        {link.name}
                      </Link>
                    ))}
                  {user?.role === "SELLER" &&
                    sellerLinks.map((link) => (
                      <Link
                        key={link.name}
                        href={link.href}
                        className="flex items-center gap-2 px-4 py-2 text-sm font-medium hover:bg-primary/10 hover:text-primary transition-colors rounded-md"
                      >
                        <link.icon className="w-4 h-4" />
                        {link.name}
                      </Link>
                    ))}
                  {user?.role === "RIDER" &&
                    riderLinks.map((link) => (
                      <Link
                        key={link.name}
                        href={link.href}
                        className="flex items-center gap-2 px-4 py-2 text-sm font-medium hover:bg-primary/10 hover:text-primary transition-colors rounded-md"
                      >
                        <link.icon className="w-4 h-4" />
                        {link.name}
                      </Link>
                    ))}
                  {user?.role === "ADMIN" &&
                    buyerLinks.map((link) => (
                      <Link
                        key={link.name}
                        href={link.href}
                        className="flex items-center gap-2 px-4 py-2 text-sm font-medium hover:bg-primary/10 hover:text-primary transition-colors rounded-md"
                      >
                        <link.icon className="w-4 h-4" />
                        {link.name}
                      </Link>
                    ))}
                  <button
                    onClick={() => signOut({ callbackUrl: "/" })}
                    className="flex items-center gap-2 px-4 py-2 text-red-500 hover:text-red-600 transition-colors"
                  >
                    <LogOut className="w-4 h-4" /> Logout
                  </button>
                </nav>
              </SheetContent>
            </Sheet>
          </div>

          <h1 className="text-lg font-semibold tracking-tight">Dashboard</h1>
        </div>

        {/* Right Section */}
        <div className="flex items-center gap-3 md:gap-4">
          <Button variant="ghost" size="icon">
            <Bell className="w-5 h-5" />
          </Button>

          <ModeToggle />

          {/* Account Dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="secondary"
                size="sm"
                className="flex items-center gap-2 px-3"
              >
                {user?.image ? (
                  <Image
                    src={user.image}
                    alt={user.name || "User"}
                    width={28}
                    height={28}
                    className="rounded-full object-cover"
                  />
                ) : (
                  <User className="w-4 h-4" />
                )}
                <span className="hidden sm:inline">
                  {user?.name?.split(" ")[0] || "Account"}
                </span>
              </Button>
            </DropdownMenuTrigger>

            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel className="flex justify-between">
                <div className="flex flex-col">
                  <span className="font-medium">
                    {user?.name || "My Account"}
                  </span>
                  {user?.email && (
                    <span className="text-xs text-muted-foreground truncate">
                      {user.email}
                    </span>
                  )}
                </div>
                {user?.role && (
                  <span className="text-xs mt-1 inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-primary/10 text-primary font-medium capitalize w-fit">
                    {user.role}
                  </span>
                )}
              </DropdownMenuLabel>

              <DropdownMenuSeparator />

              <DropdownMenuItem asChild>
                <Link href="/dashboard" className="flex items-center gap-2">
                  <LayoutDashboard className="w-4 h-4" /> Dashboard
                </Link>
              </DropdownMenuItem>

              <DropdownMenuItem asChild>
                <Link
                  href="/dashboard/profile"
                  className="flex items-center gap-2"
                >
                  <User className="w-4 h-4" /> My Profile
                </Link>
              </DropdownMenuItem>

              <DropdownMenuItem asChild>
                <Link
                  href="/dashboard/settings"
                  className="flex items-center gap-2"
                >
                  <Settings className="w-4 h-4" /> Settings
                </Link>
              </DropdownMenuItem>

              <DropdownMenuSeparator />

              <DropdownMenuItem
                onClick={() => signOut({ callbackUrl: "/" })}
                className="flex items-center gap-2 text-red-500 focus:text-red-600"
              >
                <LogOut className="w-4 h-4" /> Logout
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>
    </div>
  );
}
