import type { Metadata } from "next";
import Link from "next/link";
import { buildStaticPageMetadata } from "@/lib/seo/seo.metadata";

const legalPages = [
  {
    title: "Privacy Policy",
    href: "/privacy-policy",
    description: "How NexaMart collects, uses, and protects user information.",
  },
  {
    title: "Terms of Service",
    href: "/terms-of-service",
    description: "The core terms governing access to and use of NexaMart.",
  },
  {
    title: "Refund & Return Policy",
    href: "/refund-policy",
    description:
      "How refunds, returns, cancellations, and disputes are handled.",
  },
  {
    title: "Seller Agreement",
    href: "/seller-agreement",
    description: "Rules, responsibilities, fees, and expectations for sellers.",
  },
  {
    title: "Delivery & Rider Terms",
    href: "/delivery-rider-terms",
    description:
      "Terms for deliveries, riders, pickups, and handoff responsibilities.",
  },
  {
    title: "Prohibited Items Policy",
    href: "/prohibited-items-policy",
    description: "Items and listings that are not allowed on NexaMart.",
  },
  {
    title: "Community Guidelines",
    href: "/community-guidelines",
    description:
      "Expected user behavior across messaging, listings, and platform interactions.",
  },
];

export const metadata: Metadata = buildStaticPageMetadata("legalCenter");

export default function LegalCenterPage() {
  return (
    <main className="min-h-full bg-gray-50 px-4 py-16 dark:bg-neutral-950">
      <div className="mx-auto w-full max-w-5xl space-y-8">
        <div className="space-y-3 text-center">
          <h1 className="text--brand-blue text-3xl font-semibold sm:text-4xl">
            Legal Center
          </h1>
          <p className="mx-auto max-w-2xl text-sm text-muted-foreground sm:text-base">
            Access NexaMart’s legal policies, marketplace terms, safety rules,
            and user guidelines in one place.
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          {legalPages.map((page) => (
            <Link
              key={page.href}
              href={page.href}
              className="group rounded-2xl border border-gray-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md dark:border-neutral-700 dark:bg-neutral-900"
            >
              <div className="space-y-2">
                <h2 className="text-base font-semibold text-gray-900 transition group-hover:text--brand-blue dark:text-white">
                  {page.title}
                </h2>
                <p className="text-sm leading-relaxed text-muted-foreground dark:text-zinc-400">
                  {page.description}
                </p>
                <span className="inline-block pt-1 text-sm font-medium text--brand-blue">
                  Read page
                </span>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </main>
  );
}
