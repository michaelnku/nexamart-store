"use client";

import Link from "next/link";
import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import {
  User,
  HelpCircle,
  LogOut,
  ShoppingBag,
  Heart,
  Ticket,
  Package,
  Mail,
  ChevronDown,
  Menu,
  StoreIcon,
  HistoryIcon,
  Settings,
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
import { signOut } from "next-auth/react";
import { Sheet, SheetTrigger, SheetContent } from "@/components/ui/sheet";
import { DialogTitle } from "@radix-ui/react-dialog";
import { VisuallyHidden } from "@radix-ui/react-visually-hidden";
import { DialogHeader } from "../ui/dialog";
import { useLogout } from "@/hooks/useLogout";
import { Separator } from "../ui/separator";
import { CartBadge } from "../market-place/BadgeCounts";
import { useCurrentUserQuery } from "@/stores/useGetCurrentUserQuery";
import CurrencySelector from "../currency/CurrencySelector";
import { UserDTO } from "@/lib/types";
import { ModeToggle } from "./ModeToggle";

const menuItems = [
  { href: "/help", icon: HelpCircle, label: "Help Center" },
  {
    href: "/customer/order/history",
    icon: ShoppingBag,
    label: "Orders",
  },
  {
    href: "/customer/order/track",
    icon: Package,
    label: "Track Order",
  },
  {
    href: "/customer/wishlist",
    icon: Heart,
    label: "Wishlist",
  },
  {
    href: "/customer/voucher",
    icon: Ticket,
    label: "Voucher",
  },
  { href: "/customer/inbox", icon: Mail, label: "Inbox" },
  {
    href: "/customer/followed-seller",
    icon: StoreIcon,
    label: "Followed Sellers",
  },
  { href: "/customer/history", icon: HistoryIcon, label: "Recently Viewed" },
  { href: "/customer/settings", icon: Settings, label: "Settings" },
];

export default function SiteNavbar({
  initialUser,
}: {
  initialUser?: UserDTO | null;
}) {
  const [isVisible, setIsVisible] = useState(true);
  const lastScroll = useRef(0);

  const router = useRouter();

  useEffect(() => {
    const handleScroll = () => {
      const current = window.scrollY;

      if (current > lastScroll.current && current > 80) {
        setIsVisible(false);
      } else {
        setIsVisible(true);
      }

      lastScroll.current = current;
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const pathname = usePathname();
  const { data: user } = useCurrentUserQuery(initialUser);

  const [searchQuery, setSearchQuery] = useState("");

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
  };

  const logout = useLogout();

  return (
    <nav>
      <header
        className={`
    sticky to-top border top-0 w-full z-50
    bg-black/90 backdrop-blur-lg text-white shadow-lg
    transition-transform duration-300
    ${isVisible ? "translate-y-0" : "-translate-y-full"}
  `}
      >
        <div className="flex items-center justify-between gap-6 h-16 px-4 md:px-8 lg:px-12">
          {/* LOGO */}
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

          {/* SEARCH BAR */}
          <div className="hidden md:block flex-1 max-w-3xl mx-5">
            <form
              onSubmit={handleSearch}
              className="w-full flex items-center h-11 rounded-md overflow-hidden bg-white focus-within:ring-2 focus-within:ring-[#3c9ee0]"
            >
              <Input
                type="search"
                placeholder="Search products, brands & categories"
                className="flex-1 border-none rounded-none text-black focus-visible:ring-0"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              <Button
                type="submit"
                className="h-full rounded-none bg-[#3c9ee0] hover:bg-[#318bc4]"
              >
                🔍
              </Button>
            </form>
          </div>

          <div className="hidden md:flex items-center gap-8">
            {/* ACCOUNT DROPDOWN */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="flex flex-col text-left leading-tight hover:text-[#3c9ee0]">
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
                </button>
              </DropdownMenuTrigger>

              <DropdownMenuContent align="end" className="w-64 space-y-1">
                {!user && (
                  <>
                    <div className="p-3">
                      <Button
                        size="lg"
                        className="w-full mb-4"
                        onClick={() => router.push("/auth/login")}
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
                      href="/customer/account"
                      className={`border-b flex gap-2 w-full px-2 py-1.5 rounded-md transition
        ${
          pathname === "/customer/account"
            ? "bg-[#3c9ee0]/15 text-[#3c9ee0] font-semibold"
            : "hover:bg-muted hover:text-foreground"
        }
      `}
                    >
                      <User className="w-4 h-4" /> My Account
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
                  >
                    <Package className="w-4 h-4" /> Track Orders
                  </Link>
                </DropdownMenuItem>

                <DropdownMenuItem asChild>
                  <Link
                    href="/customer/inbox"
                    className={`flex gap-2 w-full px-2 py-1.5 rounded-md transition
      ${
        pathname === "/customer/inbox"
          ? "bg-[#3c9ee0]/15 text-[#3c9ee0] font-semibold"
          : "hover:bg-muted hover:text-foreground"
      }
    `}
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
                  >
                    <Heart className="w-4 h-4" /> Wishlist
                  </Link>
                </DropdownMenuItem>

                <DropdownMenuItem asChild>
                  <Link
                    href="/customer/voucher"
                    className={`flex gap-2 w-full px-2 py-1.5 rounded-md transition
      ${
        pathname === "/customer/voucher"
          ? "bg-[#3c9ee0]/15 text-[#3c9ee0] font-semibold"
          : "hover:bg-muted hover:text-foreground"
      }
    `}
                  >
                    <Ticket className="w-4 h-4" /> Voucher
                  </Link>
                </DropdownMenuItem>

                {user && (
                  <>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem>
                      <Button
                        variant="ghost"
                        className="flex gap-2 bg-red-50/50 w-full"
                        onClick={() => signOut({ callbackUrl: "/" })}
                      >
                        <LogOut className="w-4 h-4" /> Logout
                      </Button>
                    </DropdownMenuItem>
                  </>
                )}
              </DropdownMenuContent>
            </DropdownMenu>

            {/* RETURNS & ORDERS */}
            <Link
              href="/customer/order/history"
              className="flex flex-col leading-none hover:text-[#3c9ee0]"
            >
              <span className="text-xs">Returns</span>
              <span className="font-semibold">& Orders</span>
            </Link>

            <CurrencySelector />

            {/* CART */}
            {user?.role === "USER" && (
              <Link href="/cart" className="hover:text-[#3c9ee0]">
                <CartBadge />
              </Link>
            )}

            <ModeToggle />
          </div>

          {/* MOBILE ONLY */}
          <div className="flex md:hidden items-center gap-3">
            <CurrencySelector />

            {user?.role === "USER" && (
              <Link href="/cart">
                <CartBadge />
              </Link>
            )}

            <ModeToggle />

            {/* Mobile Drawer */}
            <Sheet>
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

                {/* Profile Header */}
                <div className="p-5 flex items-center gap-3 border-b">
                  {user?.image ? (
                    <Image
                      src={user.image}
                      alt="profile"
                      width={40}
                      height={40}
                      className="rounded-full object-cover"
                    />
                  ) : (
                    <div className="w-9 h-9 rounded-full bg-gray-300 flex items-center justify-center">
                      <User className="w-6 h-6 text-gray-600" />
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

                {/* MENU ITEMS */}
                <div className="flex flex-col px-1 space-y-1">
                  {/* Section Title */}
                  <p className="font-semibold text-gray-800 uppercase text-[13px] tracking-wide px-4 pb-2">
                    My NexaMart Account
                  </p>

                  {user && (
                    <Link
                      href="/customer/account"
                      className={`
                flex items-center gap-3 py-3 px-4 rounded-md text-sm font-medium transition
                ${
                  pathname === "/customer/account"
                    ? "bg-[#3c9ee0]/15 text-[#3c9ee0] border-l-4 border-[#3c9ee0] font-semibold"
                    : "hover:bg-muted text-muted-foreground hover:text-foreground"
                }
              `}
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
                      >
                        <Icon className="w-5 h-5" />
                        {label}
                      </Link>
                    );
                  })}
                </div>

                <Separator />

                {/* SIGN IN / LOGOUT BUTTON */}
                <div className="px-4 mt-2 pb-6">
                  {user ? (
                    <Button
                      variant={"secondary"}
                      className="w-full flex gap-2 text-red-500 "
                      onClick={logout}
                    >
                      <LogOut className="w-4 h-4" /> Logout
                    </Button>
                  ) : (
                    <Button asChild className="w-full">
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
