import type { Metadata } from "next";

import { buildNoIndexMetadata } from "@/lib/seo/seo.metadata";

export const metadata: Metadata = buildNoIndexMetadata({
  title: "Notifications",
  description: "Private NexaMart notifications and alerts.",
  path: "/notifications",
});

export default function NotificationsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
