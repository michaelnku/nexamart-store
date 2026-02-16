"use client";

import Link from "next/link";
import Image from "next/image";
import { useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import {
  User,
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
import { Separator } from "../ui/separator";
import { CartBadge } from "../marketplace/BadgeCounts";
import { useCurrentUserQuery } from "@/stores/useCurrentUserQuery";
import CurrencySelector from "../currency/CurrencySelector";
import { UserDTO } from "@/lib/types";
import { ModeToggle } from "./ModeToggle";
import { SiteSearch } from "../search/SiteSearch";
import { MobileSearchSheet } from "../search/MobileSearchSheet";
import { DashboardMenuItems } from "@/constants/dashboard-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { getUserInitials } from "@/lib/user";

export default function SiteNavbar({
  initialUser,
}: {
  initialUser?: UserDTO | null;
}) {
  const [open, setOpen] = useState(false);

  const router = useRouter();

  const pathname = usePathname() ?? "";
  const { data: user } = useCurrentUserQuery(initialUser);

  const logout = useLogout();

  const role = user?.role as "USER";
  const menuItems = DashboardMenuItems[role] || [];
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
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="flex items-center gap-2 text-left hover:text-[#3c9ee0]">
                  <Avatar size="sm">
                    {avatarUrl ? (
                      <AvatarImage src={avatarUrl} alt="Profile" />
                    ) : null}
                    <AvatarFallback>{initials}</AvatarFallback>
                  </Avatar>
                  <span className="flex flex-col leading-tight">
                    <span className="text-xs">
                      Hello,{" "}
                      {user
                        ? user.name?.split(" ")[0] || user.username
                        : "Sign in"}
                    </span>
                    <span className="font-semibold flex items-center gap-1">
                      Account & More
                      <ChevronDown className="w-4 h-4" />
                    </span>
                  </span>
                </button>
              </DropdownMenuTrigger>

              <DropdownMenuContent align="end" className="w-64 space-y-1">
                {!user && (
                  <>
                    <div className="p-3">
                      <Button
                        size="lg"
                        className="w-full mb-4"
                        onClick={() => {
                          (router.push("/auth/login"), setOpen(false));
                        }}
                      >
                        Sign in / Create Account
                      </Button>
                    </div>
                    <DropdownMenuSeparator />
                  </>
                )}

                {user && (
                  <DropdownMenuItem asChild>
                    <Link
                      href="/profile"
                      className={`border-b flex gap-2 w-full px-2 py-1.5 rounded-md transition
        ${
          pathname === "/customer/account"
            ? "bg-[#3c9ee0]/15 text-[#3c9ee0] font-semibold"
            : "hover:bg-muted hover:text-foreground"
        }
      `}
                      onClick={() => {
                        setOpen(false);
                      }}
                    >
                      <Avatar size="sm">
                        {avatarUrl ? (
                          <AvatarImage src={avatarUrl} alt="Profile" />
                        ) : null}
                        <AvatarFallback>{initials}</AvatarFallback>
                      </Avatar>
                      My Account
                    </Link>
                  </DropdownMenuItem>
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
                      setOpen(false);
                    }}
                  >
                    <Package className="w-4 h-4" /> Track Orders
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
                      setOpen(false);
                    }}
                  >
                    <Mail className="w-4 h-4" /> Inbox
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
                      setOpen(false);
                    }}
                  >
                    <Heart className="w-4 h-4" /> Wishlist
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
                      setOpen(false);
                    }}
                  >
                    <Tag className="w-4 h-4" /> Coupons
                  </Link>
                </DropdownMenuItem>

                {user && (
                  <>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem>
                      <Button
                        variant="ghost"
                        className="flex gap-2 bg-red-50/50 w-full"
                        onClick={() => {
                          logout();
                          setOpen(false);
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
              className="flex flex-col leading-none hover:text-[#3c9ee0]"
            >
              <span className="text-xs">Returns</span>
              <span className="font-semibold">& Orders</span>
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

            <Sheet open={open} onOpenChange={setOpen}>
              <SheetTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="rounded-full hover:bg-muted transition"
                  onClick={() => setOpen(false)}
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
                        ? `Hi, ${user.name?.split(" ")[0] || user.username}`
                        : "Welcome to NexaMart"}
                    </div>
                    <p className="text-sm text-gray-500">{user?.email}</p>
                  </span>
                </div>

                <div className="flex flex-col px-1 space-y-1">
                  <p className="font-semibold text-gray-800 uppercase text-[13px] tracking-wide px-4 pb-2">
                    My NexaMart Account
                  </p>

                  {user && (
                    <Link
                      href="/profile"
                      className={`
                flex items-center gap-3 py-3 px-4 rounded-md text-sm font-medium transition
                ${
                  pathname === "/profile"
                    ? "bg-[#3c9ee0]/15 text-[#3c9ee0] border-l-4 border-[#3c9ee0] font-semibold"
                    : "hover:bg-muted text-muted-foreground hover:text-foreground"
                }
              `}
                      onClick={() => setOpen(false)}
                    >
                      <User className="w-4 h-4" /> My Account
                    </Link>
                  )}

                  {menuItems.map(({ href, icon: Icon, label }) => {
                    const active = pathname === href;
                    return (
                      <Link
                        key={href}
                        href={href}
                        className={`
                flex items-center gap-3 py-3 px-4 rounded-md text-sm font-medium transition
                ${
                  active
                    ? "bg-[#3c9ee0]/15 text-[#3c9ee0] border-l-4 border-[#3c9ee0] font-semibold"
                    : "hover:bg-muted text-muted-foreground hover:text-foreground"
                }
              `}
                        onClick={() => setOpen(false)}
                      >
                        <Icon className="w-5 h-5" />
                        {label}
                      </Link>
                    );
                  })}
                </div>

                <Separator />

                <div className="px-4 mt-2 pb-6">
                  {user ? (
                    <Button
                      variant={"secondary"}
                      className="w-full flex gap-2 text-red-500 "
                      onClick={() => {
                        logout();
                        setOpen(false);
                      }}
                    >
                      <LogOut className="w-4 h-4" /> Logout
                    </Button>
                  ) : (
                    <Button
                      asChild
                      className="w-full"
                      onClick={() => {
                        setOpen(false);
                      }}
                    >
                      <Link href="/auth/login">Sign In / Create Account</Link>
                    </Button>
                  )}
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </header>
    </nav>
  );
}
