"use client";

import Link from "next/link";
import { cn } from "@/lib/utils";
import { SearchCategory } from "@/lib/types";
import { Folder } from "lucide-react";

type Props = {
  category: SearchCategory;
  active?: boolean;
  onHover?: () => void;
  onClick?: () => void;
};

export default function CategoryResultCard({
  category,
  active,
  onHover,
  onClick,
}: Props) {
  return (
    <Link
      href={`/category/${category.slug}`}
      onMouseEnter={onHover}
      onClick={onClick}
      className={cn(
        "flex items-center gap-3 p-2 rounded-md transition",
        active ? "bg-[var(--brand-blue-light)]" : "hover:bg-muted"
      )}
    >
      <div className="size-8 rounded bg-gray-100 flex items-center justify-center">
        <Folder className="w-4 h-4 text-gray-600" />
      </div>

      <span className="text-sm font-medium truncate">{category.name}</span>
    </Link>
  );
}
