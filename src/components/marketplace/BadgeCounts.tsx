"use client";

import { Badge } from "@/components/ui/badge";
import {
  Bell,
  ShoppingCart,
  Heart,
  BadgeCheck,
  ShieldAlert,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useCartStore } from "@/stores/useCartstore";
import { useWishlistStore } from "@/stores/useWishlistStore";
import { useCurrentUserQuery } from "@/stores/useCurrentUserQuery";
import { UserDTO } from "@/lib/types";

/* =========================
   Animated Counter Badge
========================= */

const AnimatedBadge = ({ count }: { count: number }) => {
  const display = count > 99 ? "99+" : count;

  return (
    <AnimatePresence>
      <motion.span
        key={display}
        initial={{ scale: 0, y: -6 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0 }}
        transition={{ type: "spring", stiffness: 280, damping: 18 }}
        className="
          absolute -top-2 -right-2
          h-5 min-w-[20px] px-1
          flex items-center justify-center
          rounded-full
          text-[11px] font-semibold
          text-white
          bg-gradient-to-br from-red-500 to-red-600
          shadow-md
          ring-2 ring-background
        "
      >
        {display}
      </motion.span>
    </AnimatePresence>
  );
};

/* =========================
   Notification Badge
========================= */

const NotificationBadge = ({ count = 0 }: { count?: number }) => {
  return (
    <div className="relative inline-flex items-center">
      <Bell className="h-6 w-6 transition-colors hover:text-primary" />
      {count > 0 && <AnimatedBadge count={count} />}
    </div>
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
    <div className="relative inline-flex items-center cursor-pointer">
      <ShoppingCart
        className={`h-5 w-5 transition ${
          count > 0
            ? "stroke-blue-600 drop-shadow-[0_0_4px_rgba(59,130,246,0.5)]"
            : "stroke-gray-400 hover:stroke-primary"
        }`}
      />

      {count > 0 && <AnimatedBadge count={count} />}
    </div>
  );
};

/* =========================
   Wishlist Badge
========================= */

const WishlistBadge = () => {
  const count = useWishlistStore((s) => s.items.length);

  return (
    <div className="relative flex items-center justify-center cursor-pointer">
      <Heart
        className={`h-5 w-5 transition ${
          count > 0
            ? "fill-red-500 stroke-red-500 drop-shadow-[0_0_6px_rgba(239,68,68,0.45)]"
            : "stroke-gray-600 hover:stroke-red-500"
        }`}
      />

      {count > 0 && <AnimatedBadge count={count} />}
    </div>
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

export {
  AnimatedBadge,
  WishlistBadge,
  CartBadge,
  NotificationBadge,
  VerifiedBadge,
};
