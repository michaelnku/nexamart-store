import type { Metadata } from "next";

import { buildStaticPageMetadata } from "@/lib/seo/seo.metadata";

export const metadata: Metadata = buildStaticPageMetadata("deliveryRiderTerms");

export default function DeliveryRiderTermsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
