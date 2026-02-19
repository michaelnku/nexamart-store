"use client";

import Link from "next/link";
import Image from "next/image";
import { useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import {
  LogOut,
  Heart,
  Package,
  Mail,
  ChevronDown,
  Menu,
  Tag,
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
import { DialogTitle } from "@radix-ui/react-dialog";
import { VisuallyHidden } from "@radix-ui/react-visually-hidden";
import { DialogHeader } from "../ui/dialog";
import { useLogout } from "@/hooks/useLogout";
import { CartBadge } from "../marketplace/BadgeCounts";
import { useCurrentUserQuery } from "@/stores/useCurrentUserQuery";
import CurrencySelector from "../currency/CurrencySelector";
import { UserDTO } from "@/lib/types";
import { ModeToggle } from "./ModeToggle";
import { SiteSearch } from "../search/SiteSearch";
import { MobileSearchSheet } from "../search/MobileSearchSheet";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { getUserInitials } from "@/lib/user";
import { CustomerSidebarContent } from "./CustomerSidebarContent";

export default function SiteNavbar({
  initialUser,
}: {
  initialUser?: UserDTO | null;
}) {
  const [sheetOpen, setSheetOpen] = useState(false);
  const [accountMenuOpen, setAccountMenuOpen] = useState(false);

  const router = useRouter();

  const pathname = usePathname() ?? "";
  const { data: user } = useCurrentUserQuery(initialUser);

  const logout = useLogout();

  const initials = getUserInitials(user);
  const avatarUrl = user?.image || user?.profileAvatar?.url;

  return (
    <nav>
      <header
        className="
    fixed top-0 left-0 right-0 z-50 w-full
    bg-black/90 backdrop-blur-lg text-white
    border-b shadow-lg
     dark:bg-neutral-950
  "
      >
        <div className="flex items-center justify-between gap-6 h-16 px-4 md:px-8 lg:px-12">
          <Link href="/" className="flex items-center gap-2">
            <Image
              src="https://ijucjait38.ufs.sh/f/rO7LkXAj4RVlnNw2KuOByscQRmqV3jX4rStz8G2Mv0IpxKJA"
              alt="logo"
              width={48}
              height={48}
              className="object-contain"
            />

            <span className="hidden sm:block font-extrabold text-2xl">
              Nexa<span className="text-[#3c9ee0]">Mart</span>
            </span>
          </Link>

          <div className="hidden md:block flex-1 max-w-3xl mx-5">
            <SiteSearch />
          </div>
          <div className="flex md:hidden items-center gap-2">
            <MobileSearchSheet variant="site" />
          </div>

          <div className="hidden md:flex items-center gap-8">
            <DropdownMenu
              open={accountMenuOpen}
              onOpenChange={setAccountMenuOpen}
            >
              <DropdownMenuTrigger asChild>
                <button className="flex items-center gap-2 text-left hover:text-[#3c9ee0] transition-colors duration-200">
                  <Avatar size="sm">
                    {avatarUrl ? (
                      <AvatarImage src={avatarUrl} alt="Profile" />
                    ) : null}
                    <AvatarFallback>{initials}</AvatarFallback>
                  </Avatar>
                  <span className="flex flex-col leading-tight">
                    <span className="text-xs text-gray-400">
                      {user
                        ? `Welcome back, ${user.name?.split(" ")[0] || user.username}`
                        : "Welcome"}
                    </span>

                    <span className="font-semibold flex items-center gap-1">
                      My Account
                      <ChevronDown className="w-4 h-4 opacity-70" />
                    </span>
                  </span>
                </button>
              </DropdownMenuTrigger>

              <DropdownMenuContent
                align="end"
                className="w-72 p-2 bg-white dark:bg-neutral-900 border shadow-xl rounded-xl"
              >
                {!user && (
                  <>
                    <div className="p-3">
                      <Button
                        size="lg"
                        className="w-full bg-[#3c9ee0] hover:bg-[#3187c9] text-white rounded-lg"
                        onClick={() => {
                          router.push("/auth/login");
                          setAccountMenuOpen(false);
                        }}
                      >
                        Sign in / Create Account
                      </Button>
                    </div>
                    <DropdownMenuSeparator />
                  </>
                )}

                {user && (
                  <>
                    <DropdownMenuItem asChild>
                      <Link
                        href="/profile"
                        className={` flex gap-2 w-full px-2 py-1.5 rounded-md transition
        ${
          pathname === "/customer/account"
            ? "bg-[#3c9ee0]/15 text-[#3c9ee0] font-medium"
            : "hover:bg-muted hover:text-foreground"
        }
      `}
                        onClick={() => {
                          setAccountMenuOpen(false);
                        }}
                      >
                        <Avatar size="sm">
                          {avatarUrl ? (
                            <AvatarImage src={avatarUrl} alt="Profile" />
                          ) : null}
                          <AvatarFallback>{initials}</AvatarFallback>
                        </Avatar>
                        Account Overview
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                  </>
                )}

                <DropdownMenuItem asChild>
                  <Link
                    href="/customer/order/track"
                    className={`flex gap-2 w-full px-2 py-1.5 rounded-md transition
      ${
        pathname === "/customer/order/track"
          ? "bg-[#3c9ee0]/15 text-[#3c9ee0] font-semibold"
          : "hover:bg-muted hover:text-foreground"
      }
    `}
                    onClick={() => {
                      setAccountMenuOpen(false);
                    }}
                  >
                    <Package className="w-4 h-4" /> Track a Package
                  </Link>
                </DropdownMenuItem>

                <DropdownMenuItem asChild>
                  <Link
                    href="/inbox"
                    className={`flex gap-2 w-full px-2 py-1.5 rounded-md transition
      ${
        pathname === "/customer/inbox"
          ? "bg-[#3c9ee0]/15 text-[#3c9ee0] font-semibold"
          : "hover:bg-muted hover:text-foreground"
      }
    `}
                    onClick={() => {
                      setAccountMenuOpen(false);
                    }}
                  >
                    <Mail className="w-4 h-4" /> Messages
                  </Link>
                </DropdownMenuItem>

                <DropdownMenuItem asChild>
                  <Link
                    href="/customer/wishlist"
                    className={`flex gap-2 w-full px-2 py-1.5 rounded-md transition
      ${
        pathname === "/customer/wishlist"
          ? "bg-[#3c9ee0]/15 text-[#3c9ee0] font-semibold"
          : "hover:bg-muted hover:text-foreground"
      }
    `}
                    onClick={() => {
                      setAccountMenuOpen(false);
                    }}
                  >
                    <Heart className="w-4 h-4" /> Saved Items
                  </Link>
                </DropdownMenuItem>

                <DropdownMenuItem asChild>
                  <Link
                    href="/customer/coupons"
                    className={`flex gap-2 w-full px-2 py-1.5 rounded-md transition
      ${
        pathname === "/customer/coupons"
          ? "bg-[#3c9ee0]/15 text-[#3c9ee0] font-semibold"
          : "hover:bg-muted hover:text-foreground"
      }
    `}
                    onClick={() => {
                      setAccountMenuOpen(false);
                    }}
                  >
                    <Tag className="w-4 h-4" />
                    Promotions & Coupons
                  </Link>
                </DropdownMenuItem>

                {user && (
                  <>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem>
                      <Button
                        variant="ghost"
                        className="flex gap-2 w-full text-red-600 hover:bg-red-50 dark:hover:bg-red-950 rounded-md"
                        onClick={() => {
                          logout();
                          setAccountMenuOpen(false);
                        }}
                      >
                        <LogOut className="w-4 h-4" /> Logout
                      </Button>
                    </DropdownMenuItem>
                  </>
                )}
              </DropdownMenuContent>
            </DropdownMenu>

            <Link
              href="/customer/order/history"
              className="flex flex-col leading-tight hover:text-[#3c9ee0] transition"
            >
              <span className="text-xs text-gray-400">Orders</span>
              <span className="font-semibold">Returns & History</span>
            </Link>

            <CurrencySelector />

            {user?.role === "USER" && (
              <Link href="/cart" className="hover:text-[#3c9ee0]">
                <CartBadge />
              </Link>
            )}

            <ModeToggle />
          </div>

          <div className="flex md:hidden items-center gap-3">
            <CurrencySelector />

            {user?.role === "USER" && (
              <Link href="/cart">
                <CartBadge />
              </Link>
            )}

            <ModeToggle />

            <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
              <SheetTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="rounded-full hover:bg-muted transition"
                >
                  <Menu className="w-5 h-5" />
                </Button>
              </SheetTrigger>

              <SheetContent
                side="right"
                className="w-80 p-0 overflow-y-auto bg-background"
              >
                <DialogHeader>
                  <VisuallyHidden>
                    <DialogTitle>Mobile Menu</DialogTitle>
                  </VisuallyHidden>
                </DialogHeader>

                <div className="p-5 flex items-center gap-3 border-b">
                  {avatarUrl ? (
                    <Image
                      src={avatarUrl}
                      alt="profile"
                      width={40}
                      height={40}
                      className="rounded-full object-cover"
                    />
                  ) : (
                    <div className="w-9 h-9 rounded-full bg-gray-300 flex items-center justify-center">
                      <span className="text-xs font-semibold text-gray-700">
                        {initials}
                      </span>
                    </div>
                  )}
                  <span>
                    <div className="font-medium text-base">
                      {user
                        ? `Welcome back, ${user.name?.split(" ")[0] || user.username}`
                        : "Welcome to NexaMart"}
                    </div>
                    <p className="text-sm text-gray-500">{user?.email}</p>
                  </span>
                </div>

                <CustomerSidebarContent
                  user={user}
                  pathname={pathname}
                  isMobile
                  onNavigate={() => setSheetOpen(false)}
                  onLogout={logout}
                />
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </header>
    </nav>
  );
}
