"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import {
  Mail,
  ShieldCheck,
  Truck,
  Headset,
  Facebook,
  Instagram,
  Youtube,
  Twitter,
  Globe,
} from "lucide-react";
import CurrencySelector from "../currency/CurrencySelector";

const Footer = () => {
  const year = new Date().getFullYear();

  return (
    <motion.footer
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.1 }}
      transition={{ duration: 0.6 }}
      className="bg-[#0f172a] text-white"
    >
      {/* ================= BRAND TRUST BAR ================= */}
      <div className="border-b border-white/10 bg-gradient-to-r from-[#3c9ee0]/20 to-[#3c9ee0]/5">
        <div className="mx-auto flex max-w-7xl flex-col gap-6 px-6 py-8 lg:flex-row lg:items-center lg:justify-between">
          <div className="grid w-full gap-3 text-sm sm:grid-cols-2 lg:max-w-3xl lg:grid-cols-3">
            <TrustBadge
              icon={<ShieldCheck className="h-5 w-5 text-[#3c9ee0]" />}
              label="Secure escrow payments"
            />
            <TrustBadge
              icon={<Truck className="h-5 w-5 text-[#3c9ee0]" />}
              label="Smart logistics network"
            />
            <TrustBadge
              icon={<Headset className="h-5 w-5 text-[#3c9ee0]" />}
              label="Real human support"
            />
          </div>

          <div className="flex w-full flex-col gap-3 sm:w-auto sm:flex-row sm:flex-wrap">
            <Link href="/auth/seller/register">
              <button className="w-full rounded-xl bg-[#3c9ee0] px-5 py-2 font-semibold text-white transition hover:bg-[#318bc4] sm:w-auto">
                Start Selling
              </button>
            </Link>

            <Link href="/auth/rider/register">
              <button className="w-full rounded-xl border border-[#3c9ee0] px-5 py-2 text-[#3c9ee0] transition hover:bg-[#3c9ee0]/10 sm:w-auto">
                Become a Rider
              </button>
            </Link>
          </div>
        </div>
      </div>

      {/* ================= MAIN FOOTER ================= */}
      <div className="mx-auto grid max-w-7xl grid-cols-2 gap-10 px-6 py-14 md:grid-cols-3 lg:grid-cols-6">
        {/* BRAND BLOCK */}
        <div className="col-span-2 space-y-4 lg:col-span-2">
          <h2 className="text-2xl font-bold tracking-tight">
            Nexa<span className="text-[#3c9ee0]">Mart</span>
          </h2>

          <p className="max-w-sm text-sm leading-relaxed text-gray-400">
            NexaMart is building an intelligent digital marketplace that
            empowers sellers, riders, and customers with secure payments,
            transparent logistics, and seamless commerce.
          </p>

          <div className="flex items-center gap-3 pt-2">
            <Globe className="h-4 w-4 text-[#3c9ee0]" />
            <span className="text-xs text-gray-400">
              Built for scale. Built for trust.
            </span>
          </div>
        </div>

        <FooterColumn
          title="Marketplace"
          links={[
            { label: "Explore Stores", href: "/store" },
            { label: "Trending Products", href: "/products?sort=Trending" },
            { label: "New Arrivals", href: "/products?sort=New" },
          ]}
        />

        <FooterColumn
          title="Support"
          links={[
            { label: "Help Center", href: "/help" },
            { label: "Track Order", href: "/customer/order/track" },
            { label: "Refund Policy", href: "/refund-policy" },
            { label: "Contact Us", href: "/contact" },
          ]}
        />

        <FooterColumn
          title="Company"
          links={[
            { label: "About NexaMart", href: "/about" },
            { label: "Careers", href: "/careers" },
            { label: "Partnerships", href: "/partners" },
            { label: "Legal Center", href: "/legal" },
          ]}
        />

        <FooterColumn
          title="Legal"
          links={[
            { label: "Privacy Policy", href: "/privacy-policy" },
            { label: "Terms of Service", href: "/terms-of-service" },
            { label: "Seller Agreement", href: "/seller-agreement" },
            { label: "Delivery & Rider Terms", href: "/delivery-rider-terms" },
            {
              label: "Prohibited Items Policy",
              href: "/prohibited-items-policy",
            },
            { label: "Community Guidelines", href: "/community-guidelines" },
          ]}
        />
      </div>

      {/* ================= NEWSLETTER + SOCIAL ================= */}
      <div className="border-t border-white/10">
        <div className="mx-auto flex max-w-7xl flex-col justify-between gap-10 px-6 py-10 lg:flex-row">
          {/* Newsletter */}
          <div className="w-full lg:w-1/2">
            <h4 className="mb-2 flex items-center gap-2 font-semibold">
              <Mail className="h-4 w-4 text-[#3c9ee0]" />
              Stay ahead with NexaMart
            </h4>

            <p className="mb-4 text-sm text-gray-400">
              Get product drops, seller opportunities, and exclusive deals.
            </p>

            <form
              onSubmit={(e) => e.preventDefault()}
              className="flex flex-col gap-2 sm:flex-row"
            >
              <input
                type="email"
                placeholder="Your email address"
                className="w-full rounded-lg bg-[#1e293b] px-4 py-2 text-white outline-none focus:ring-2 focus:ring-[#3c9ee0]"
                required
              />
              <button
                type="submit"
                className="rounded-lg bg-[#3c9ee0] px-5 py-2 font-semibold transition hover:bg-[#318bc4]"
              >
                Subscribe
              </button>
            </form>
          </div>

          {/* Currency + Social */}
          <div className="flex w-full flex-col gap-6 lg:w-auto">
            <CurrencySelector />

            <div>
              <h4 className="mb-3 font-semibold">Connect with us</h4>
              <div className="flex gap-4 text-gray-400">
                <Link
                  href="#"
                  aria-label="Facebook"
                  className="transition hover:text-[#3c9ee0]"
                >
                  <Facebook className="h-5 w-5" />
                </Link>
                <Link
                  href="#"
                  aria-label="Instagram"
                  className="transition hover:text-[#3c9ee0]"
                >
                  <Instagram className="h-5 w-5" />
                </Link>
                <Link
                  href="#"
                  aria-label="Twitter"
                  className="transition hover:text-[#3c9ee0]"
                >
                  <Twitter className="h-5 w-5" />
                </Link>
                <Link
                  href="#"
                  aria-label="YouTube"
                  className="transition hover:text-[#3c9ee0]"
                >
                  <Youtube className="h-5 w-5" />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ================= BOTTOM ================= */}
      <div className="border-t border-white/10">
        <div className="mx-auto flex max-w-7xl flex-col gap-3 px-6 py-6 text-center text-xs text-gray-500 md:flex-row md:items-center md:justify-between md:text-left">
          <p>
            © {year}{" "}
            <span className="font-semibold text-white">
              Nexa<span className="text-[#3c9ee0]">Mart</span>
            </span>
            . Empowering digital commerce.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-2 md:justify-end">
            <Link href="/legal" className="transition hover:text-[#3c9ee0]">
              Legal Center
            </Link>
            <Link
              href="/privacy-policy"
              className="transition hover:text-[#3c9ee0]"
            >
              Privacy
            </Link>
            <Link
              href="/terms-of-service"
              className="transition hover:text-[#3c9ee0]"
            >
              Terms
            </Link>
            <Link
              href="/refund-policy"
              className="transition hover:text-[#3c9ee0]"
            >
              Refunds
            </Link>
          </div>
        </div>
      </div>
    </motion.footer>
  );
};

const FooterColumn = ({
  title,
  links,
}: {
  title: string;
  links: { label: string; href: string }[];
}) => (
  <div className="space-y-3">
    <h3 className="text-sm font-semibold text-white">{title}</h3>
    <div className="space-y-2">
      {links.map((link) => (
        <Link
          key={`${title}-${link.href}`}
          href={link.href}
          className="block text-sm text-gray-400 transition hover:text-[#3c9ee0]"
        >
          {link.label}
        </Link>
      ))}
    </div>
  </div>
);

const TrustBadge = ({
  icon,
  label,
}: {
  icon: React.ReactNode;
  label: string;
}) => (
  <div className="flex min-h-14 items-center gap-3 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-gray-200 backdrop-blur-sm">
    <div className="shrink-0">{icon}</div>
    <span className="text-sm leading-snug">{label}</span>
  </div>
);

export default Footer;
