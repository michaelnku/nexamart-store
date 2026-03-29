import type { Metadata } from "next";

import { buildStaticPageMetadata } from "@/lib/seo/seo.metadata";

export const metadata: Metadata = buildStaticPageMetadata(
  "prohibitedItemsPolicy",
);

export default function ProhibitedItemsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
