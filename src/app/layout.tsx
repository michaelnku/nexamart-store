import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

import { auth } from "@/auth/auth";
import QueryProvider from "@/providers/queryProvider";

import { NextSSRPlugin } from "@uploadthing/react/next-ssr-plugin";
import { extractRouterConfig } from "uploadthing/server";
import { ourFileRouter } from "./api/uploadthing/core";
import { CartHydrator } from "@/components/marketplace/CartHydrator";
import { buildRootMetadata } from "@/lib/seo/seo.metadata";
import Providers from "./providers";

/* ===========================
   Fonts
=========================== */

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
  display: "swap",
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
  display: "swap",
});

export async function generateMetadata(): Promise<Metadata> {
  return buildRootMetadata();
}

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#000000" },
  ],
};

/* ===========================
   Root Layout
=========================== */

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-background text-foreground`}
      >
        <NextSSRPlugin routerConfig={extractRouterConfig(ourFileRouter)} />

        <QueryProvider>
          <Providers session={session}>
            <CartHydrator />

            {children}
          </Providers>
        </QueryProvider>
      </body>
    </html>
  );
}
