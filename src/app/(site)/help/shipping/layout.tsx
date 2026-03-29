import type { Metadata } from "next";

import { buildNoIndexMetadata } from "@/lib/seo/seo.metadata";

export const metadata: Metadata = buildNoIndexMetadata({
  title: "Shipping Help",
  description: "Shipping guidance page for NexaMart users.",
  path: "/help/shipping",
});

export default function HelpShippingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
