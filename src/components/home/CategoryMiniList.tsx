"use client";

import { useEffect, useState, memo } from "react";
import { Category } from "@/lib/types";
import Link from "next/link";
import Image from "next/image";
import {
  HoverCard,
  HoverCardTrigger,
  HoverCardContent,
} from "@/components/ui/hover-card";
import { LayoutGrid } from "lucide-react";

type Props = { categories: Category[] };

/** Simple media query hook */
function useIsDesktop() {
  const [isDesktop, setIsDesktop] = useState(false);

  useEffect(() => {
    const media = window.matchMedia("(min-width: 1024px)");
    setIsDesktop(media.matches);

    const listener = () => setIsDesktop(media.matches);
    media.addEventListener?.("change", listener);
    media.addListener?.(listener);
    return () => media.removeEventListener("change", listener);
  }, []);

  return isDesktop;
}

function CategoryMiniList({ categories }: Props) {
  const isDesktop = useIsDesktop();

  if (!categories?.length) {
    return (
      <section className="bg-card border rounded-xl p-6">
        <h2 className="text-sm font-semibold mb-2">Shop by Category</h2>
        <p className="text-muted-foreground text-sm">No categories available</p>
      </section>
    );
  }

  return (
    <section className="bg-card border h-full rounded-xl p-4">
      <div
        className="
  grid grid-cols-2 gap-3
  md:flex md:flex-col md:divide-y md:justify-between
"
      >
        {categories.slice(0, 4).map((cat) => {
          const CardContent = (
            <div
              className="
                group flex flex-col items-center gap-2
                rounded-xl border bg-background p-4
                transition-colors hover:bg-muted
              "
            >
              <div
                className="
                  flex items-center justify-center
                  w-12 h-12 rounded-full
                  bg-[var(--brand-blue-light)]
                  group-hover:bg-[var(--brand-blue)]
                  transition-colors
                "
              >
                {cat.iconImage && (
                  <Image
                    src={cat.iconImage}
                    alt={cat.name}
                    width={20}
                    height={20}
                    loading="lazy"
                    decoding="async"
                    className="group-hover:invert"
                  />
                )}
              </div>

              <span className="text-sm font-medium text-center">
                {cat.name}
              </span>
            </div>
          );

          // 👉 Desktop: hover shows subcategories
          if (isDesktop && cat.children?.length) {
            return (
              <HoverCard key={cat.id} openDelay={150} closeDelay={100}>
                <HoverCardTrigger asChild>
                  <Link href={`/category/${cat.slug}`}>{CardContent}</Link>
                </HoverCardTrigger>

                <HoverCardContent
                  side="right"
                  align="start"
                  sideOffset={8}
                  collisionPadding={12}
                  className="
                    w-[min(700px,90vw)]
                    rounded-2xl border bg-background p-6
                    shadow-xl grid grid-cols-2 sm:grid-cols-3 gap-6
                  "
                >
                  {cat.children.map((sub) => (
                    <div key={sub.id} className="space-y-2">
                      <Link
                        href={`/category/${sub.slug}`}
                        className="font-semibold text-sm hover:text-[var(--brand-blue)]"
                      >
                        {sub.name}
                      </Link>

                      {sub.children?.length ? (
                        <ul className="space-y-1">
                          {sub.children.map((child) => (
                            <li key={child.id}>
                              <Link
                                href={`/category/${child.slug}`}
                                className="text-sm text-muted-foreground hover:text-[var(--brand-blue)]"
                              >
                                {child.name}
                              </Link>
                            </li>
                          ))}
                        </ul>
                      ) : null}
                    </div>
                  ))}
                </HoverCardContent>
              </HoverCard>
            );
          }

          // 👉 Mobile: simple navigation (no hover)
          return (
            <Link key={cat.id} href={`/category/${cat.slug}`}>
              {CardContent}
            </Link>
          );
        })}
        <Link
          href="/category"
          className="
    group flex flex-col items-center gap-2
    rounded-xl border bg-background p-4
    transition-colors hover:bg-muted
  "
        >
          <div
            className="
      flex items-center justify-center
      w-12 h-12 rounded-full
      border border-dashed
      text-muted-foreground
      group-hover:text-[var(--brand-blue)]
      transition-colors
    "
          >
            <LayoutGrid className="w-5 h-5" />
          </div>

          <span className="text-sm font-medium text-center">
            All Categories
          </span>
        </Link>
      </div>
    </section>
  );
}

export default memo(CategoryMiniList);
