import type { Metadata } from "next";

import { buildStaticPageMetadata } from "@/lib/seo/seo.metadata";

export const metadata: Metadata = buildStaticPageMetadata("refundPolicy");

export default function RefundPolicyLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
