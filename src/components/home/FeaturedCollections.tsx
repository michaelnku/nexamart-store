"use client";

import Link from "next/link";
import { Flame, Sparkles, BadgePercent, Star } from "lucide-react";

const COLLECTIONS = [
  {
    title: "Trending Now",
    icon: Flame,
    href: "/products?sort=Trending",
    description: "Popular this week",
  },
  {
    title: "New Arrivals",
    icon: Sparkles,
    href: "/products?sort=New",
    description: "Just added",
  },
  {
    title: "Best Deals",
    icon: BadgePercent,
    href: "/products?sort=discount",
    description: "Save more today",
  },
  {
    title: "Top Rated",
    icon: Star,
    href: "/products?sort=Top_Rated",
    description: "Loved by buyers",
  },
];

export default function FeaturedCollections() {
  return (
    <section className="h-full min-h-0 space-y-3">
      <h2 className="text-lg font-semibold">Featured Collections</h2>

      <div className="grid min-h-0 grid-cols-2 gap-4 md:grid-cols-4 items-stretch">
        {COLLECTIONS.map((item) => {
          const Icon = item.icon;

          return (
            <Link
              key={item.title}
              href={item.href}
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
            </Link>
          );
        })}
      </div>
    </section>
  );
}
