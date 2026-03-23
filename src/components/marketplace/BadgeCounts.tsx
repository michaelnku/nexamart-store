"use client";

import { Badge } from "@/components/ui/badge";
import { IconCountBadge } from "@/components/ui/icon-count-badge";
import {
  Bell,
  ShoppingCart,
  Heart,
  BadgeCheck,
  ShieldAlert,
} from "lucide-react";
import { motion } from "framer-motion";
import { useCartStore } from "@/stores/useCartstore";
import { useWishlistStore } from "@/stores/useWishlistStore";
import { useCurrentUserQuery } from "@/stores/useCurrentUserQuery";
import { UserDTO } from "@/lib/types";

const NotificationBadge = ({ count = 0 }: { count?: number }) => {
  return (
    <IconCountBadge count={count}>
      <Bell
        className={`h-5 w-5 transition ${
          count > 0
            ? "stroke-blue-700 dark:stroke-[var(--brand-blue)]"
            : "stroke-gray-400 dark:stroke-zinc-500"
        }`}
      />
    </IconCountBadge>
  );
};

/* =========================
   Cart Badge
========================= */

const CartBadge = () => {
  const count = useCartStore((s) =>
    s.items.reduce((total, i) => total + i.quantity, 0),
  );

  return (
    <IconCountBadge count={count} className="cursor-pointer">
      <ShoppingCart
        className={`h-5 w-5 transition ${
          count > 0
            ? "stroke-blue-700 dark:stroke-[var(--brand-blue)]"
            : "stroke-gray-400 hover:stroke-blue-700 dark:stroke-zinc-500"
        }`}
      />
    </IconCountBadge>
  );
};

/* =========================
   Wishlist Badge
========================= */

const WishlistBadge = () => {
  const count = useWishlistStore((s) => s.items.length);

  return (
    <IconCountBadge count={count} className="cursor-pointer justify-center">
      <Heart
        className={`h-5 w-5 transition ${
          count > 0
            ? "fill-red-500 stroke-red-500 drop-shadow-[0_0_6px_rgba(239,68,68,0.45)]"
            : "stroke-gray-600 hover:stroke-red-500 dark:stroke-zinc-400"
        }`}
      />
    </IconCountBadge>
  );
};

/* =========================
   Verified Badge
========================= */

const roleBadgeConfig: Record<
  UserDTO["role"],
  {
    label: string;
    color: string;
    icon: typeof BadgeCheck;
  }
> = {
  USER: {
    label: "Verified",
    color: "green",
    icon: BadgeCheck,
  },

  SELLER: {
    label: "Verified Seller",
    color: "emerald",
    icon: BadgeCheck,
  },

  RIDER: {
    label: "Verified Rider",
    color: "blue",
    icon: BadgeCheck,
  },

  ADMIN: {
    label: "Trusted Admin",
    color: "violet",
    icon: BadgeCheck,
  },

  MODERATOR: {
    label: "Moderator",
    color: "indigo",
    icon: BadgeCheck,
  },

  SYSTEM: {
    label: "System",
    color: "gray",
    icon: BadgeCheck,
  },
};

const VerifiedBadge = ({ user: providedUser }: { user?: UserDTO | null }) => {
  const { data: queriedUser } = useCurrentUserQuery();
  const user = providedUser ?? queriedUser;

  if (!user) return null;

  const config = roleBadgeConfig[user.role];
  const Icon = config.icon;

  if (!user.isVerified) {
    return (
      <Badge
        variant="outline"
        className="
        flex items-center gap-1.5
        px-2.5 py-[5px]
        text-xs font-semibold
        border-amber-500
        text-amber-700
        bg-amber-50
        dark:bg-amber-900/30
        dark:text-amber-200
        shadow-sm
      "
      >
        <ShieldAlert className="w-3.5 h-3.5" />
        Not Verified
      </Badge>
    );
  }

  const color = config.color;

  return (
    <motion.div
      initial={{ scale: 0.9, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ duration: 0.25 }}
    >
      <Badge
        variant="outline"
        className={`
        relative flex items-center gap-1.5
        px-2.5 py-[5px]
        text-xs font-semibold
        shadow-sm transition hover:shadow-md
        border-${color}-500
        text-${color}-700
        bg-${color}-50
        dark:bg-${color}-900/30
        dark:text-${color}-200
        `}
      >
        {/* Glow */}
        <span
          className={`absolute inset-0 rounded-md bg-${color}-400/10 blur-md opacity-40 pointer-events-none`}
        />

        <Icon className="w-3.5 h-3.5" />

        {config.label}
      </Badge>
    </motion.div>
  );
};

export { WishlistBadge, CartBadge, NotificationBadge, VerifiedBadge };
