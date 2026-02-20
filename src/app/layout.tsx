import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

import { auth } from "@/auth/auth";
import QueryProvider from "@/providers/queryProvider";

import { NextSSRPlugin } from "@uploadthing/react/next-ssr-plugin";
import { extractRouterConfig } from "uploadthing/server";
import { ourFileRouter } from "./api/uploadthing/core";
import { CartHydrator } from "@/components/marketplace/CartHydrator";
import {
  APP_DESCRIPTION,
  APP_LOGO,
  APP_NAME,
  APP_TWITTER,
  APP_URL,
} from "@/lib/seo";
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

/* ===========================
   App Constants
=========================== */

/* ===========================
   Metadata (SEO + Social)
=========================== */

export const metadata: Metadata = {
  metadataBase: new URL(APP_URL),

  title: {
    default: `${APP_NAME} | Smart Online Marketplace`,
    template: `%s | ${APP_NAME}`,
  },

  description: APP_DESCRIPTION,

  applicationName: APP_NAME,
  generator: "Next.js",
  category: "shopping",

  keywords: [
    "NexaMart",
    "online shopping",
    "ecommerce platform",
    "marketplace",
    "buy and sell online",
    "multi vendor store",
    "shop online",
  ],

  authors: [{ name: "NexaMart Team" }],
  creator: "NexaMart",
  publisher: "NexaMart",

  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
    },
  },

  openGraph: {
    type: "website",
    locale: "en_US",
    url: APP_URL,
    siteName: APP_NAME,
    title: `${APP_NAME} | Smart Online Marketplace`,
    description: APP_DESCRIPTION,
    images: [
      {
        url: APP_LOGO,
        width: 1200,
        height: 630,
        alt: "NexaMart Online Marketplace",
      },
    ],
  },

  twitter: {
    card: "summary_large_image",
    title: `${APP_NAME} | Smart Online Marketplace`,
    description: APP_DESCRIPTION,
    images: [APP_LOGO],
    creator: APP_TWITTER,
  },

  icons: {
    icon: "/favicon.ico",
    shortcut: "/favicon.ico",
    apple: "/apple-touch-icon.png",
  },

  manifest: "/site.webmanifest",

  viewport: {
    width: "device-width",
    initialScale: 1,
    maximumScale: 1,
  },

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
