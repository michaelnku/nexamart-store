"use client";

import Link from "next/link";
import { FaWhatsapp } from "react-icons/fa";
import { useState } from "react";
import { becomeSellerAction, becomeRiderAction } from "@/actions/auth/roles";
import {
  Mail,
  ShieldCheck,
  Truck,
  Headset,
  InstagramIcon,
  FacebookIcon,
  YoutubeIcon,
  TwitterIcon,
} from "lucide-react";

const Footer = () => {
  const [currency, setCurrency] = useState("USD");

  return (
    <footer className="bg-[#232F3E] text-white mt-10 pt-10 sticky to-bottom w-full">
      {/* ================= TRUST + CTA ================= */}
      <div className="bg-[#37475A] py-10 px-6 text-center space-y-6">
        <div className="flex flex-col sm:flex-row items-center justify-center gap-8 text-sm font-medium">
          <TrustBadge
            icon={<ShieldCheck className="w-5 h-5" />}
            label="100% Secure Shopping"
          />
          <TrustBadge
            icon={<Truck className="w-5 h-5" />}
            label="Fast Nationwide Delivery"
          />
          <TrustBadge
            icon={<Headset className="w-5 h-5" />}
            label="24/7 Premium Customer Support"
          />
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <form action={becomeSellerAction}>
            <button className="bg-yellow-400 hover:bg-yellow-500 text-black font-semibold px-6 py-2 rounded-lg shadow transition">
              🚀 Sell on Nexa-Mart
            </button>
          </form>

          <form action={becomeRiderAction}>
            <button className="bg-[#3c9ee0] hover:bg-[#318bc4] text-white font-semibold px-6 py-2 rounded-lg shadow transition">
              🛵 Become a Rider
            </button>
          </form>
        </div>
      </div>

      {/* ================= FOOTER LINKS ================= */}
      <div className="max-w-7xl mx-auto grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-10 px-6 py-12">
        <FooterColumn
          title="Get to Know Us"
          links={[
            { label: "About Us", href: "/about" },
            { label: "Careers", href: "/careers" },
            { label: "Press & News", href: "/news" },
          ]}
        />
        <FooterColumn
          title="Customer Service"
          links={[
            { label: "Help Center", href: "/help" },
            { label: "Returns & Refunds", href: "/help/refunds" },
            { label: "Shipping Info", href: "/help/shipping" },
            { label: "Track Order", href: "/customer/order/history" },
          ]}
        />
        <FooterColumn
          title="Earn With Us"
          links={[
            { label: "Sell on Nexa-Mart", href: "/become-seller" },
            { label: "Become a Rider", href: "/become-rider" },
            { label: "Affiliate Program", href: "/affiliate" },
          ]}
        />
        <FooterColumn
          title="Legal & Policies"
          links={[
            { label: "Privacy Policy", href: "/privacy" },
            { label: "Terms of Service", href: "/terms" },
            { label: "Cookies Policy", href: "/cookies" },
          ]}
        />
      </div>

      {/* ================= NEWSLETTER + CURRENCY / SOCIAL ================= */}
      <div className="border-t border-white/20 px-6 py-10">
        <div className="max-w-7xl mx-auto flex flex-col lg:flex-row justify-between gap-10">
          {/* NEWSLETTER */}
          <div className="w-full lg:w-2/5">
            <h4 className="font-semibold mb-2 flex items-center gap-2">
              <Mail className="w-4 h-4" /> Stay updated!
            </h4>
            <p className="text-sm text-gray-300 mb-3">
              Subscribe to receive deals, discounts and offers.
            </p>
            <form
              onSubmit={(e) => e.preventDefault()}
              className="flex gap-2 mt-2"
            >
              <input
                type="email"
                placeholder="Enter your email"
                className="w-full px-4 py-2 bg-white text-black rounded outline-none"
                required
              />
              <button className="px-4 bg-yellow-400 text-black font-semibold rounded hover:bg-yellow-500 transition">
                Subscribe
              </button>
            </form>
          </div>

          {/* CURRENCY SELECTOR */}
          <div className="hidden flex-col gap-3 w-full lg:w-1/4">
            <label className="text-sm font-medium">Currency</label>
            <select
              value={currency}
              onChange={(e) => setCurrency(e.target.value)}
              className="border bg-gray-700 px-3 py-2 rounded text-sm"
            >
              <option value="USD">$ USD — US Dollar</option>
              <option value="NGN">₦ NGN — Nigerian Naira</option>
              <option value="GBP">£ GBP — British Pound</option>
              <option value="EUR">€ EUR — Euro</option>
              <option value="KES">KSh KES — Kenyan Shilling</option>
              <option value="GHC">GH₵ GHC — Ghanaian Cedi</option>
              <option value="ZAR">R ZAR — South African Rand</option>
            </select>
          </div>

          {/* SOCIAL ICONS */}
          <div className="flex flex-col gap-3 w-full lg:w-1/4">
            <h4 className="font-semibold">Follow us</h4>
            <div className="flex gap-4 text-gray-300 text-xl">
              <Link href="#">
                <i className="ri-facebook-fill hover:text-white transition">
                  <FacebookIcon />
                </i>
              </Link>
              <Link href="#">
                <i className="ri-instagram-line hover:text-white transition">
                  <InstagramIcon />
                </i>
              </Link>
              <Link href="#">
                <i className="ri-twitter-x-line hover:text-white transition">
                  <YoutubeIcon />
                </i>
              </Link>
              <Link href="#">
                <i className="ri-youtube-fill hover:text-white transition">
                  <TwitterIcon />
                </i>
              </Link>
              <Link href="#">
                <i className="ri-tiktok-fill hover:text-white transition">
                  <FaWhatsapp />
                </i>
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* ================= COPYRIGHT ================= */}
      <div className="border-t border-white/20 text-center py-6 text-gray-300 text-xs">
        © {new Date().getFullYear()}{" "}
        <span className="font-semibold">Nexa-mart</span>. All rights reserved.
      </div>
    </footer>
  );
};

const FooterColumn = ({
  title,
  links,
}: {
  title: string;
  links: { label: string; href: string }[];
}) => (
  <div className="space-y-2">
    <h3 className="text-sm font-semibold mb-2">{title}</h3>
    {links.map((l) => (
      <Link
        key={l.href}
        href={l.href}
        className="block text-sm text-gray-300 hover:text-white hover:underline transition"
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
  <div className="flex items-center gap-2 text-gray-200">
    {icon}
    <span className="text-sm">{label}</span>
  </div>
);

export default Footer;
