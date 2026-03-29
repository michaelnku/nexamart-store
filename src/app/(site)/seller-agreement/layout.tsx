import type { Metadata } from "next";

import { buildStaticPageMetadata } from "@/lib/seo/seo.metadata";

export const metadata: Metadata = buildStaticPageMetadata("sellerAgreement");

export default function SellerAgreementLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
