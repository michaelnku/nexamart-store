import type { Metadata } from "next";

import { buildNoIndexMetadata } from "@/lib/seo/seo.metadata";

export const metadata: Metadata = buildNoIndexMetadata({
  title: "Cart",
  description: "Review your NexaMart cart before checkout.",
  path: "/cart",
});

export default function CartLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
