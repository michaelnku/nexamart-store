import Link from "next/link";
import Image from "next/image";
import { SearchProductCard } from "@/lib/types";
import { createProductSlug } from "@/lib/productSlug";

type Props = {
  product: SearchProductCard;
  active?: boolean;
  onHover?: () => void;
  onClick?: () => void;
};

export function SearchResultCard({ product, active, onHover, onClick }: Props) {
  return (
    <Link
      href={`/product/${createProductSlug(product.name, product.id)}`}
      onMouseEnter={onHover}
      onClick={onClick}
      className={`flex  gap-3 p-2 rounded transition ${
        active ? "bg-[var(--brand-blue-light)]" : "hover:bg-muted"
      }`}
    >
      {product.images[0] && (
        <Image
          src={product.images[0].imageUrl}
          alt={product.name}
          width={40}
          height={40}
          className="rounded object-cover"
        />
      )}

      <div className="min-w-0">
        <p className="font-bold text-gray-700 text-sm truncate">
          {product.name}
        </p>
        <p className="text-xs text-gray-500 truncate">{product.store.name}</p>
      </div>
    </Link>
  );
}
