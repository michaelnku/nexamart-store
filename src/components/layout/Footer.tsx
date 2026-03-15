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
  return (
    <motion.footer
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.1 }}
      transition={{ duration: 0.6 }}
      className="bg-[#0f172a] text-white"
    >
      {/* ================= BRAND TRUST BAR ================= */}
      <div className="bg-gradient-to-r from-[#3c9ee0]/20 to-[#3c9ee0]/5 border-b border-white/10">
        <div className="max-w-7xl mx-auto px-6 py-8 flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex items-center gap-6 text-sm">
            <TrustBadge
              icon={<ShieldCheck className="w-5 h-5 text-[#3c9ee0]" />}
              label="Secure escrow payments"
            />
            <TrustBadge
              icon={<Truck className="w-5 h-5 text-[#3c9ee0]" />}
              label="Smart logistics network"
            />
            <TrustBadge
              icon={<Headset className="w-5 h-5 text-[#3c9ee0]" />}
              label="Real human support"
            />
          </div>

          <div className="flex gap-3">
            <Link href="/auth/seller/register">
              <button className="bg-[#3c9ee0] hover:bg-[#318bc4] text-white font-semibold px-5 py-2 rounded-xl transition">
                Start Selling
              </button>
            </Link>
            <Link href="/auth/rider/register">
              <button className="border border-[#3c9ee0] text-[#3c9ee0] hover:bg-[#3c9ee0]/10 px-5 py-2 rounded-xl transition">
                Become a Rider
              </button>
            </Link>
          </div>
        </div>
      </div>

      {/* ================= MAIN FOOTER ================= */}
      <div className="max-w-7xl mx-auto px-6 py-14 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-10">
        {/* BRAND BLOCK */}
        <div className="col-span-2 lg:col-span-2 space-y-4">
          <h2 className="text-2xl font-bold tracking-tight">
            Nexa<span className="text-[#3c9ee0]">Mart</span>
          </h2>
          <p className="text-sm text-gray-400 leading-relaxed max-w-sm">
            NexaMart is building the world&apos;s most intelligent digital
            marketplace — empowering sellers, riders, and customers with secure
            payments, transparent logistics, and seamless commerce.
          </p>

          <div className="flex items-center gap-3 pt-2">
            <Globe className="w-4 h-4 text-[#3c9ee0]" />
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
            { label: "Refund Policy", href: "/help/refunds" },
          ]}
        />

        <FooterColumn
          title="Company"
          links={[
            { label: "About NexaMart", href: "/about" },
            { label: "Careers", href: "/careers" },
            { label: "Partnerships", href: "/partners" },
            { label: "Privacy Policy", href: "/privacy-policy" },
            { label: "Terms of Service", href: "/terms-of-service" },
            { label: "Contact", href: "/contact" },
          ]}
        />
      </div>

      {/* ================= NEWSLETTER + SOCIAL ================= */}
      <div className="border-t border-white/10">
        <div className="max-w-7xl mx-auto px-6 py-10 flex flex-col lg:flex-row justify-between gap-10">
          {/* Newsletter */}
          <div className="w-full lg:w-1/2">
            <h4 className="font-semibold mb-2 flex items-center gap-2">
              <Mail className="w-4 h-4 text-[#3c9ee0]" />
              Stay ahead with NexaMart
            </h4>
            <p className="text-sm text-gray-400 mb-4">
              Get product drops, seller opportunities, and exclusive deals.
            </p>
            <form onSubmit={(e) => e.preventDefault()} className="flex gap-2">
              <input
                type="email"
                placeholder="Your email address"
                className="w-full px-4 py-2 rounded-lg bg-[#1e293b] text-white outline-none focus:ring-2 focus:ring-[#3c9ee0]"
                required
              />
              <button className="px-5 bg-[#3c9ee0] hover:bg-[#318bc4] rounded-lg font-semibold transition">
                Subscribe
              </button>
            </form>
          </div>

          {/* Currency + Social */}
          <div className="flex flex-col gap-6 w-full lg:w-auto">
            <CurrencySelector />

            <div>
              <h4 className="font-semibold mb-3">Connect with us</h4>
              <div className="flex gap-4 text-gray-400">
                <Link href="#">
                  <Facebook className="w-5 h-5 hover:text-[#3c9ee0] transition" />
                </Link>
                <Link href="#">
                  <Instagram className="w-5 h-5 hover:text-[#3c9ee0] transition" />
                </Link>
                <Link href="#">
                  <Twitter className="w-5 h-5 hover:text-[#3c9ee0] transition" />
                </Link>
                <Link href="#">
                  <Youtube className="w-5 h-5 hover:text-[#3c9ee0] transition" />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ================= BOTTOM ================= */}
      <div className="border-t border-white/10 text-center py-6 text-gray-500 text-xs">
        © {new Date().getFullYear()}{" "}
        <span className="font-semibold text-white">
          Nexa<span className="text-[#3c9ee0]">Mart</span>
        </span>
        . Empowering digital commerce.
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
    {links.map((l) => (
      <Link
        key={l.href}
        href={l.href}
        className="block text-sm text-gray-400 hover:text-[#3c9ee0] transition"
      >
        {l.label}
      </Link>
    ))}
  </div>
);

const TrustBadge = ({
  icon,
  label,
}: {
  icon: React.ReactNode;
  label: string;
}) => (
  <div className="flex items-center gap-2 text-gray-300">
    {icon}
    <span>{label}</span>
  </div>
);

export default Footer;
