import type { Metadata } from "next";

import { buildNoIndexMetadata } from "@/lib/seo/seo.metadata";

export const metadata: Metadata = buildNoIndexMetadata({
  title: "Settings",
  description: "Private NexaMart account and marketplace settings.",
  path: "/settings",
});

export default function SettingsRootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return <div className="h-full min-h-full">{children}</div>;
}
