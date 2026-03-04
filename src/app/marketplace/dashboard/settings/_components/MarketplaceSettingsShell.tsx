"use client";

import { AnimatePresence, motion } from "framer-motion";
import {
  Shield,
  Store,
  Bike,
  ShieldCheck,
  Globe,
  Truck,
  CreditCard,
  Megaphone,
  Lock,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

type MarketplaceRole = "ADMIN" | "SELLER" | "RIDER" | "MODERATOR";

type NavItem = {
  label: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
};

const roleNavMap: Record<MarketplaceRole, NavItem[]> = {
  ADMIN: [
    {
      label: "Admin",
      href: "/marketplace/dashboard/settings/roles/admin",
      icon: Shield,
    },
    {
      label: "Platform",
      href: "/marketplace/dashboard/settings/platform",
      icon: Globe,
    },
    {
      label: "Shipping",
      href: "/marketplace/dashboard/settings/shipping",
      icon: Truck,
    },
    {
      label: "Payments",
      href: "/marketplace/dashboard/settings/payments",
      icon: CreditCard,
    },
    {
      label: "Marketing",
      href: "/marketplace/dashboard/settings/marketing",
      icon: Megaphone,
    },
    {
      label: "Security",
      href: "/marketplace/dashboard/settings/security",
      icon: Lock,
    },
  ],
  SELLER: [
    {
      label: "Seller",
      href: "/marketplace/dashboard/settings/roles/seller",
      icon: Store,
    },
  ],
  RIDER: [
    {
      label: "Rider",
      href: "/marketplace/dashboard/settings/roles/rider",
      icon: Bike,
    },
  ],
  MODERATOR: [
    {
      label: "Moderator",
      href: "/marketplace/dashboard/settings/roles/moderator",
      icon: ShieldCheck,
    },
  ],
};

function isActivePath(pathname: string, href: string) {
  return pathname === href || pathname.startsWith(`${href}/`);
}

type Props = {
  role: MarketplaceRole;
  children: React.ReactNode;
};

export default function MarketplaceSettingsShell({ role, children }: Props) {
  const pathname = usePathname();
  const navItems = roleNavMap[role];

  return (
    <div className="min-h-full bg-background py-4">
      <div className="px-2 md:hidden sticky top-0 z-20 bg-background border-b">
        <div className="flex gap-2 overflow-x-auto px-2 py-3 scrollbar-hide">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = isActivePath(pathname, item.href);

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-2 whitespace-nowrap px-4 py-2 rounded-full text-sm font-medium transition ${
                  active ? "bg-[#3c9ee0] text-white" : "bg-gray-100 text-gray-700"
                }`}
              >
                <Icon className="w-4 h-4" />
                {item.label}
              </Link>
            );
          })}
        </div>
      </div>

      <div className="max-w-6xl mx-auto flex gap-8 px-4 py-8">
        <aside className="hidden md:block w-64 shrink-0 border-r bg-background">
          <ul className="p-4 space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const active = isActivePath(pathname, item.href);

              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className={`flex items-center gap-3 w-full text-left px-4 py-2 rounded-md text-sm font-medium transition ${
                      active
                        ? "bg-[#3c9ee0]/10 text-[#3c9ee0]"
                        : "text-gray-700 hover:bg-gray-100"
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    {item.label}
                  </Link>
                </li>
              );
            })}
          </ul>
        </aside>

        <main className="flex-1 min-w-0">
          <AnimatePresence mode="wait">
            <motion.div
              key={pathname}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.2 }}
              className="space-y-6"
            >
              {children}
            </motion.div>
          </AnimatePresence>
        </main>
      </div>
    </div>
  );
}
