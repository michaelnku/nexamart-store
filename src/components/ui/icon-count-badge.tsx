"use client";

import { AnimatePresence, motion } from "framer-motion";

import { cn } from "@/lib/utils";

type CountBadgeProps = {
  count: number;
  max?: number;
  className?: string;
};

function formatCountDisplay(count: number, max = 99) {
  return count > max ? `${max}+` : `${count}`;
}

function CountBadge({ count, max = 99, className }: CountBadgeProps) {
  if (count <= 0) {
    return null;
  }

  const display = formatCountDisplay(count, max);

  return (
    <AnimatePresence>
      <motion.span
        key={display}
        initial={{ scale: 0, y: -6 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0 }}
        transition={{ type: "spring", stiffness: 280, damping: 18 }}
        className={cn(
          "absolute -right-2 -top-2 flex h-5 min-w-[20px] items-center justify-center rounded-full bg-gradient-to-br from-red-500 to-red-600 px-1 text-[11px] font-semibold text-white shadow-md ring-2 ring-background dark:ring-zinc-950",
          className,
        )}
      >
        {display}
      </motion.span>
    </AnimatePresence>
  );
}

type IconCountBadgeProps = {
  count: number;
  children: React.ReactNode;
  className?: string;
  badgeClassName?: string;
  max?: number;
};

function IconCountBadge({
  count,
  children,
  className,
  badgeClassName,
  max = 99,
}: IconCountBadgeProps) {
  return (
    <span className={cn("relative inline-flex items-center", className)}>
      {children}
      <CountBadge count={count} max={max} className={badgeClassName} />
    </span>
  );
}

export { CountBadge, IconCountBadge, formatCountDisplay };
