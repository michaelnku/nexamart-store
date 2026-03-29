import type { Metadata } from "next";
import Link from "next/link";
import { buildStaticPageMetadata } from "@/lib/seo/seo.metadata";

const helpArticles = [
  {
    title: "How Orders Work",
    href: "/help/how-orders-work",
    description:
      "Understand how purchases, sellers, and fulfillment work on NexaMart.",
  },
  {
    title: "How Delivery Works",
    href: "/help/how-delivery-works",
    description:
      "Learn how delivery assignments, pickups, and drop-offs operate.",
  },
  {
    title: "Track Your Order",
    href: "/help/how-to-track-order",
    description: "See how to track the status of your order after checkout.",
  },
  {
    title: "Payments & Wallet",
    href: "/help/payments-and-wallets",
    description: "Understand how payments, escrow, and wallet balances work.",
  },
  {
    title: "Refunds & Disputes",
    href: "/help/refunds-and-disputes",
    description: "How to request help when something goes wrong with an order.",
  },
  {
    title: "Seller Getting Started",
    href: "/help/seller-getting-started",
    description: "How to create a store and start selling on NexaMart.",
  },
  {
    title: "Rider Getting Started",
    href: "/help/rider-getting-started",
    description: "Learn how deliveries work if you're a NexaMart rider.",
  },
  {
    title: "Account & Security",
    href: "/help/account-and-security",
    description: "Managing your account, security, and login protection.",
  },
];

export const metadata: Metadata = buildStaticPageMetadata("helpCenter");

export default function HelpCenterPage() {
  return (
    <main className="min-h-full bg-gray-50 px-4 py-16 dark:bg-neutral-950">
      <div className="mx-auto max-w-5xl space-y-10">
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-semibold text--brand-blue sm:text-4xl">
            NexaMart Help Center
          </h1>
          <p className="text-sm text-muted-foreground">
            Find answers about orders, payments, delivery, and marketplace
            features.
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          {helpArticles.map((article) => (
            <Link
              key={article.href}
              href={article.href}
              className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm hover:shadow-md transition dark:border-neutral-700 dark:bg-neutral-900"
            >
              <h2 className="font-semibold text-gray-900 dark:text-white">
                {article.title}
              </h2>
              <p className="text-sm text-muted-foreground mt-1">
                {article.description}
              </p>
            </Link>
          ))}
        </div>
      </div>
    </main>
  );
}
