import type { Metadata } from "next";

import { buildNoIndexMetadata } from "@/lib/seo/seo.metadata";

export const metadata: Metadata = buildNoIndexMetadata({
  title: "Cookies",
  description: "Cookie information for NexaMart visitors.",
  path: "/cookies",
});

export default function CookiesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
