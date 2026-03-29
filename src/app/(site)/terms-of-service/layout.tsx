import type { Metadata } from "next";

import { buildStaticPageMetadata } from "@/lib/seo/seo.metadata";

export const metadata: Metadata = buildStaticPageMetadata("termsOfService");

export default function TermsOfServiceLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
