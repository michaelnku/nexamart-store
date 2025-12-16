"use client";

import Link from "next/link";
import { SearchCategory } from "@/lib/types";

type Props = {
  category: SearchCategory;
};

export default function CategoryResultCard({ category }: Props) {
  return (
    <Link
      href={`/category/${category.slug}`}
      className="block border rounded-xl p-4 bg-white shadow-sm hover:shadow-md transition"
    >
      <p className="font-medium">{category.name}</p>
      <p className="text-xs text-gray-500 mt-1">Browse category</p>
    </Link>
  );
}
