"use client";

import { Badge } from "@/components/ui/badge";
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

const AnimatedBadge = ({ count }: { count: number }) => {
  const display = count > 99 ? "99+" : count;

  return (
    <motion.span
      initial={{ scale: 0 }}
      animate={{ scale: 1 }}
      exit={{ scale: 0 }}
      transition={{ type: "spring", stiffness: 260, damping: 20 }}
      className="absolute -top-2 -right-2 h-5 min-w-[20px] px-1 flex items-center justify-center 
        bg-red-600 text-white text-xs font-semibold rounded-full shadow"
    >
      {display}
    </motion.span>
  );
};

const NotificationBadge = ({ count = 0 }: { count?: number }) => {
  return (
    <div className="relative inline-flex items-center">
      <Bell className="h-6 w-6" />
      {count > 0 && <AnimatedBadge count={count} />}
    </div>
  );
};

const CartBadge = () => {
  const count = useCartStore((s) =>
    s.items.reduce((total, i) => total + i.quantity, 0),
  );

  return (
    <div className="relative inline-flex items-center cursor-pointer">
      <ShoppingCart
        className={`h-5 w-5 ${
          count > 0 ? "stroke-blue-700" : "stroke-gray-600"
        }`}
      />
      {count > 0 && <AnimatedBadge count={count} />}
    </div>
  );
};

// 💖 Wishlist Badge
const WishlistBadge = () => {
  const count = useWishlistStore((s) => s.items.length);

  return (
    <div className="relative flex justify-center items-center">
      <Heart
        className={` h-5 w-5 transition ${
          count > 0
            ? "fill-red-500 stroke-red-500"
            : "stroke-gray-600 hover:stroke-red-500"
        }`}
      />
      {count > 0 && <AnimatedBadge count={count} />}
    </div>
  );
};

const VerifiedBadge = () => {
  const { data: user } = useCurrentUserQuery();

  if (!user) return null;

  console.log("USER FROM QUERY:", user);

  return user.isVerified ? (
    <Badge
      variant="outline"
      className="border-green-500 text-green-700 bg-green-50 dark:bg-green-900/30 dark:text-green-200 flex items-center gap-1 px-2.5 py-1 text-xs font-semibold"
    >
      <BadgeCheck className="w-3.5 h-3.5" />
      {user?.role === "SELLER" ? "Verified Seller" : "Verified Rider"}
    </Badge>
  ) : (
    <Badge
      variant="outline"
      className="border-amber-500 text-amber-700 bg-amber-50 dark:bg-amber-900/30 dark:text-amber-200 flex items-center gap-1 px-2.5 py-1 text-xs font-semibold"
    >
      <ShieldAlert className="w-3.5 h-3.5" />
      Not Verified
    </Badge>
  );
};

export { WishlistBadge, CartBadge, NotificationBadge, VerifiedBadge };
