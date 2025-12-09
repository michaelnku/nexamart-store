"use client";

import { Category } from "@/lib/types";
import Link from "next/link";
import Image from "next/image";
import {
  HoverCard,
  HoverCardTrigger,
  HoverCardContent,
} from "@/components/ui/hover-card";

type Props = { categories: Category[] };

export default function CategoryShowcase({ categories }: Props) {
  if (!categories || categories.length === 0) {
    return (
      <section className="relative bg-white dark:bg-neutral-900 border rounded-xl shadow-sm p-5">
        <h2 className="text-xl font-bold mb-4">Shop by Category</h2>
        <p>No categories at the moment</p>
      </section>
    );
  }

  return (
    <section className="relative bg-white dark:bg-neutral-900 border rounded-xl shadow-sm p-5">
      <h2 className="text-xl font-bold mb-4">Shop by Category</h2>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
        {categories.map((cat) => (
          <HoverCard key={cat.id} openDelay={80} closeDelay={120}>
            <HoverCardTrigger asChild>
              <Link
                href={`/category/${cat.slug}`}
                className="flex flex-col items-center gap-2 p-4 border rounded-lg shadow-sm text-center font-medium
                transition duration-200 hover:bg-[var(--brand-blue)] hover:text-white"
              >
                {cat.iconImage && (
                  <Image
                    src={cat.iconImage}
                    alt={cat.name}
                    width={40}
                    height={40}
                  />
                )}
                {cat.name}
              </Link>
            </HoverCardTrigger>

            {(cat.children?.length ?? 0) > 0 && (
              <HoverCardContent
                side="bottom"
                align="start"
                className="bg-white dark:bg-neutral-800 border rounded-xl shadow-xl  
               w-full grid grid-cols-2 sm:grid-cols-3 gap-6 z-50"
              >
                {cat.children?.map((sub) => (
                  <div key={sub.id} className="space-y-1">
                    {/* Level 2 */}
                    <Link
                      href={`/category/${sub.slug}`}
                      className="font-semibold text-[var(--brand-blue)] hover:underline"
                    >
                      {sub.name}
                    </Link>

                    {/* Level 3 (only if present) */}
                    {sub.children && sub.children.length > 0 && (
                      <ul className="mt-2 space-y-1">
                        {sub.children.map((child) => (
                          <li key={child.id}>
                            <Link
                              href={`/category/${child.slug}`}
                              className="text-sm text-gray-600 dark:text-gray-300 hover:text-[var(--brand-blue)]"
                            >
                              {child.name}
                            </Link>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                ))}
              </HoverCardContent>
            )}
          </HoverCard>
        ))}
      </div>
    </section>
  );
}
