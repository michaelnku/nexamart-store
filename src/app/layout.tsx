import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

import { auth } from "@/auth/auth";
import { SessionProvider } from "next-auth/react";
import { Toaster } from "@/components/ui/sonner";
import { ThemeProvider } from "@/theme/theme-provider";
import QueryProvider from "@/providers/queryProvider";

import { NextSSRPlugin } from "@uploadthing/react/next-ssr-plugin";
import { extractRouterConfig } from "uploadthing/server";
import { ourFileRouter } from "./api/uploadthing/core";
import { CurrencyProvider } from "@/providers/currencyProvider";

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

const APP_NAME = "NexaMart";
const APP_DESCRIPTION =
  "NexaMart is a modern multi-vendor e-commerce marketplace where you can shop, sell, and manage deliveries seamlessly.";
const APP_URL = "https://nexamart-store-psi.vercel.app";
const APP_LOGO =
  "https://ijucjait38.ufs.sh/f/rO7LkXAj4RVlnNw2KuOByscQRmqV3jX4rStz8G2Mv0IpxKJA";

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
    "Nigeria ecommerce",
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
    creator: "@nexamart",
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
        <QueryProvider>
          <SessionProvider session={session}>
            <NextSSRPlugin routerConfig={extractRouterConfig(ourFileRouter)} />

            <ThemeProvider
              attribute="class"
              defaultTheme="system"
              enableSystem
              disableTransitionOnChange
            >
              {/* App Content */}
              <CurrencyProvider>{children}</CurrencyProvider>

              {/* Global Toasts */}
              <Toaster richColors closeButton />
            </ThemeProvider>
          </SessionProvider>
        </QueryProvider>
      </body>
    </html>
  );
}
