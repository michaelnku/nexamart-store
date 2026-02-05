import Link from "next/link";
import Image from "next/image";
import { Store as StoreIcon } from "lucide-react";
import { Card } from "@/components/ui/card";

type StoresCardStore = {
  id: string;
  name: string;
  slug: string;
  logo?: string | null;
  location?: string | null;
  tagline?: string | null;
  followers?: number;
};

type Props = {
  store: StoresCardStore;
};

const formatFollowers = (n: number) => {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + "M";
  if (n >= 1_000) return (n / 1_000).toFixed(1) + "K";
  return n.toString();
};

export default function StoresCard({ store }: Props) {
  return (
    <Card className="rounded-xl border bg-white shadow-sm hover:shadow-md transition">
      <Link href={`/store/${store.slug}`} className="block p-4 space-y-3">
        <div className="flex items-center gap-3">
          <div className="relative size-14 rounded-full bg-gray-100 overflow-hidden shrink-0">
            {store.logo ? (
              <Image
                src={store.logo}
                alt={store.name}
                fill
                className="object-cover"
              />
            ) : (
              <div className="size-full flex items-center justify-center">
                <StoreIcon className="w-5 h-5 text-gray-500" />
              </div>
            )}
          </div>

          <div className="min-w-0">
            <h3 className="font-semibold truncate">{store.name}</h3>
            {store.location && (
              <p className="text-xs text-gray-500 truncate">{store.location}</p>
            )}
          </div>
        </div>

        {store.tagline && (
          <p className="text-sm text-gray-600 line-clamp-2">{store.tagline}</p>
        )}

        <div className="flex items-center justify-between text-xs">
          <span className="text-gray-500">
            {formatFollowers(store.followers ?? 0)} followers
          </span>
          <span className="text-[#3c9ee0]">Visit store -&gt;</span>
        </div>
      </Link>
    </Card>
  );
}
