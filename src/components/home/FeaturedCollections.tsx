"use client";

import { animate } from "framer-motion";
import { MouseEvent, useCallback } from "react";
import { Flame, Sparkles, BadgePercent, Star } from "lucide-react";

const COLLECTIONS = [
  {
    title: "Trending Now",
    icon: Flame,
    href: "#trending-now",
    description: "Popular this week",
  },
  {
    title: "New Arrivals",
    icon: Sparkles,
    href: "#new-arrivals",
    description: "Just added",
  },
  {
    title: "Best Deals",
    icon: BadgePercent,
    href: "#deals-and-discounts",
    description: "Save more today",
  },
  {
    title: "Top Rated",
    icon: Star,
    href: "#top-rated",
    description: "Loved by buyers",
  },
];

export default function FeaturedCollections() {
  const getScrollParent = (element: HTMLElement | null): HTMLElement | null => {
    let parent = element?.parentElement ?? null;

    while (parent) {
      const style = window.getComputedStyle(parent);
      const overflowY = style.overflowY;
      const isScrollable =
        (overflowY === "auto" || overflowY === "scroll") &&
        parent.scrollHeight > parent.clientHeight;

      if (isScrollable) return parent;
      parent = parent.parentElement;
    }

    return null;
  };

  const handleSmoothScroll = useCallback(
    (event: MouseEvent<HTMLAnchorElement>) => {
      const href = event.currentTarget.getAttribute("href");
      if (!href?.startsWith("#")) return;

      event.preventDefault();

      const target = document.querySelector<HTMLElement>(href);
      if (!target) return;

      window.history.pushState(null, "", href);

      const prefersReducedMotion = window.matchMedia(
        "(prefers-reduced-motion: reduce)"
      ).matches;
      const scrollParent = getScrollParent(target);

      if (prefersReducedMotion) {
        target.scrollIntoView({ block: "start" });
        return;
      }

      if (scrollParent) {
        const parentRect = scrollParent.getBoundingClientRect();
        const targetRect = target.getBoundingClientRect();
        const from = scrollParent.scrollTop;
        const destination =
          from + (targetRect.top - parentRect.top) - 96;

        animate(from, destination, {
          duration: 0.7,
          ease: [0.22, 1, 0.36, 1],
          onUpdate: (latest) => {
            scrollParent.scrollTop = latest;
          },
        });
        return;
      }

      const from = window.scrollY;
      const destination = Math.max(
        0,
        target.getBoundingClientRect().top + window.scrollY - 96
      );
      animate(from, destination, {
        duration: 0.7,
        ease: [0.22, 1, 0.36, 1],
        onUpdate: (latest) => window.scrollTo({ top: latest }),
      });
    },
    []
  );

  return (
    <section className="h-full min-h-0 space-y-3">
      <h2 className="text-lg font-semibold">Featured Collections</h2>

      <div className="grid min-h-0 grid-cols-2 gap-4 md:grid-cols-4 items-stretch">
        {COLLECTIONS.map((item) => {
          const Icon = item.icon;

          return (
            <a
              key={item.title}
              href={item.href}
              onClick={handleSmoothScroll}
              className="
                group flex h-full min-h-0 flex-col gap-2
                rounded-xl border bg-card
                p-4
                hover:bg-muted transition-colors
              "
            >
              <div className="flex items-center gap-2">
                <Icon className="w-5 h-5 text-[var(--brand-blue)]" />
                <span className="font-medium">{item.title}</span>
              </div>

              <p className="text-sm text-muted-foreground">
                {item.description}
              </p>
            </a>
          );
        })}
      </div>
    </section>
  );
}
