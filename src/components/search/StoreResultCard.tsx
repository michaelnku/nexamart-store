"use client";

import Link from "next/link";
import Image from "next/image";
import { cn } from "@/lib/utils";
import { SearchStore } from "@/lib/types";
import { Store } from "lucide-react";

type Props = {
  store: SearchStore;
  active?: boolean;
  onHover?: () => void;
  onClick?: () => void;
};

export default function StoreResultCard({
  store,
  active,
  onHover,
  onClick,
}: Props) {
  return (
    <Link
      href={`/store/${store.slug}`}
      onMouseEnter={onHover}
      onClick={onClick}
      className={cn(
        "flex items-center gap-3 p-2 rounded-md transition",
        active ? "bg-[var(--brand-blue-light)]" : "hover:bg-muted"
      )}
    >
      <div className="relative w-12 h-12 rounded-full bg-gray-100 overflow-hidden">
        {store.logo ? (
          <Image
            src={store.logo}
            alt={store.name}
            fill
            className="object-cover"
          />
        ) : (
          <div className="size-8 rounded bg-gray-100 flex items-center justify-center">
            <Store className="w-4 h-4 text-gray-600" />
          </div>
        )}
      </div>

      <span className="text-sm font-medium text-gray-700 truncate">
        {store.name}
      </span>
    </Link>
  );
}
