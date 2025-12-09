"use client";

import {
  LogOut,
  Settings,
  ShoppingBag,
  HistoryIcon,
  Heart,
  Wallet,
  StoreIcon,
  MessageSquareOffIcon,
  Mail,
} from "lucide-react";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { useLogout } from "@/hooks/useLogout";
import { useCurrentUserQuery } from "@/stores/getCurrentUser";

const accountLinks = [
  { name: "Orders", href: "/customer/order/history", icon: ShoppingBag },
  { name: "Inbox", href: "/customer/inbox", icon: Mail },
  { name: "Wishlist", href: "/customer/wishlist", icon: Heart },
  {
    name: "Pending Reviews",
    href: "/customer/reviewsratings",
    icon: MessageSquareOffIcon,
  },
  { name: "My Wallet", href: "/customer/wallet", icon: Wallet },
  { name: "Voucher", href: "/customer/coupon", icon: Wallet },
  {
    name: "Followed Sellers",
    href: "/customer/followed-sellers",
    icon: StoreIcon,
  },
  { name: "Recently Viewed", href: "/customer/history", icon: HistoryIcon },
  { name: "Settings", href: "/customer/settings", icon: Settings },
];

export default function Dashboard() {
  const { data: user } = useCurrentUserQuery();
  const pathname = usePathname();

  const isActive = (href: string) =>
    pathname.replace(/\/$/, "") === href.replace(/\/$/, "") ||
    pathname.startsWith(href + "/");

  const logout = useLogout();

  const navItem = (href: string, IconComponent: any, name: string) => (
    <Link
      key={name}
      href={href}
      className={`flex items-center gap-3 text-[15px] px-4 py-2 rounded-md transition-all 
      ${
        isActive(href)
          ? "bg-[var(--brand-blue-light)] text-[var(--brand-blue)] border-l-4 border-[var(--brand-blue)] font-semibold"
          : "text-gray-600 hover:bg-gray-100"
      }`}
    >
      {IconComponent && <IconComponent className="w-5 h-5" />}
      {name}
    </Link>
  );

  const SidebarContent = (
    <div className="flex flex-col h-full light:bg-white">
      {/* Greeting */}
      <div className="px-4 pb-3">
        <p className="font-semibold text-[17px] text-gray-900">
          Hello, {user?.name?.split(" ")[0]}
        </p>
        <p className="text-sm text-gray-500">{user?.email}</p>
      </div>

      <Separator />

      {/* Section Title */}
      <p className="font-semibold text-gray-800 uppercase text-[13px] tracking-wide px-4 pt-4 pb-2">
        My NexaMart Account
      </p>

      {/* Navigation */}
      <div className="flex flex-col gap-1 w-full space-y-1 px-4">
        {accountLinks.map((link) => navItem(link.href, link.icon, link.name))}
      </div>

      {/* Sticky Logout */}
      <div>
        <Separator className="mb-4 mt-4" />
        <div className="mt-auto p-4">
          <Button
            variant="outline"
            onClick={logout}
            className="w-full flex gap-2 text-red-500 hover:text-red-600"
          >
            <LogOut className="w-4 h-4" /> Logout
          </Button>
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* DESKTOP SIDEBAR */}
      <aside className="hidden md:flex flex-col w-64 light:bg-white border-r py-6">
        {SidebarContent}
      </aside>
    </>
  );
}
