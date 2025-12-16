"use client";

import Link from "next/link";
import Image from "next/image";
import { SearchStore } from "@/lib/types";

type Props = {
  store: SearchStore;
};

export default function StoreResultCard({ store }: Props) {
  return (
    <Link
      href={`/store/${store.slug}`}
      className="flex items-center gap-4 border rounded-xl p-4 bg-white shadow-sm hover:shadow-md transition"
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
          <div className="w-full h-full flex items-center justify-center text-sm text-gray-400">
            Store
          </div>
        )}
      </div>

      <div className="min-w-0">
        <p className="font-medium truncate">{store.name}</p>
        <p className="text-xs text-gray-500">Visit store</p>
      </div>
    </Link>
  );
}
