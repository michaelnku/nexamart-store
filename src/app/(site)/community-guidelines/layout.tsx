import type { Metadata } from "next";

import { buildStaticPageMetadata } from "@/lib/seo/seo.metadata";

export const metadata: Metadata = buildStaticPageMetadata("communityGuidelines");

export default function CommunityGuidelinesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
