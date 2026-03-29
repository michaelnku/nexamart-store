import type { Metadata } from "next";

import { buildNoIndexMetadata } from "@/lib/seo/seo.metadata";

export const metadata: Metadata = buildNoIndexMetadata({
  title: "Messages",
  description: "Private NexaMart messaging conversations.",
  path: "/messages",
});

export default function MessagesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
