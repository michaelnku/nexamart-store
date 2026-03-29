import type { Metadata } from "next";

import { buildNoIndexMetadata } from "@/lib/seo/seo.metadata";

export const metadata: Metadata = buildNoIndexMetadata({
  title: "History",
  description: "Private NexaMart browsing and activity history.",
  path: "/history",
});

export default function HistoryLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
