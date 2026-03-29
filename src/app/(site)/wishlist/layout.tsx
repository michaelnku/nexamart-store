import type { Metadata } from "next";

import { buildNoIndexMetadata } from "@/lib/seo/seo.metadata";

export const metadata: Metadata = buildNoIndexMetadata({
  title: "Wishlist",
  description: "Saved products in your private NexaMart wishlist.",
  path: "/wishlist",
});

export default function WishlistLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
