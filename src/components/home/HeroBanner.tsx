"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { HeroBannerWithFiles } from "@/lib/types";

export default function HeroBanner({
  banners,
}: {
  banners: HeroBannerWithFiles[];
}) {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    if (banners.length <= 1) return;

    const id = setInterval(() => {
      setIndex((prev) => (prev + 1) % banners.length);
    }, 8000);

    return () => clearInterval(id);
  }, [banners.length]);

  if (!banners.length) return null;

  const banner = banners[index];

  const backgroundUrl = banner.backgroundImage?.url || "/fallback-banner.jpg";

  const productUrl = banner.productImage?.url ?? null;

  const BannerContent = (
    <div className="relative w-full h-[260px] sm:h-[340px] lg:h-full rounded-2xl overflow-hidden cursor-pointer group">
      <AnimatePresence mode="wait">
        <motion.div
          key={banner.id}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.8 }}
          className="absolute inset-0"
        >
          <Image
            src={backgroundUrl}
            alt={banner.title || "Banner"}
            fill
            priority
            className="object-cover transition-transform duration-700 group-hover:scale-105"
          />
        </motion.div>
      </AnimatePresence>

      <div className="absolute inset-0 bg-black/35" />

      <div className="relative z-10 h-full flex items-center justify-between px-8">
        <div className="max-w-xl text-white space-y-4">
          <motion.h1
            key={banner.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-3xl sm:text-4xl font-bold leading-tight"
          >
            {banner.title}
          </motion.h1>

          {banner.subtitle && (
            <p className="text-white/90 text-sm sm:text-base">
              {banner.subtitle}
            </p>
          )}

          {banner.ctaText && (
            <span className="inline-block bg-white text-[#3c9ee0] font-semibold px-6 py-2 rounded-xl transition group-hover:scale-105">
              {banner.ctaText}
            </span>
          )}
        </div>

        {productUrl && (
          <motion.div
            initial={{ opacity: 0, x: 40 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6 }}
            className="hidden lg:block"
          >
            <Image
              src={productUrl}
              alt="Product"
              width={320}
              height={320}
              className="object-contain drop-shadow-2xl"
            />
          </motion.div>
        )}
      </div>
    </div>
  );

  if (banner.ctaLink) {
    return (
      <Link
        href={banner.ctaLink}
        className="block focus:outline-none focus:ring-2 focus:ring-[#3c9ee0] rounded-2xl"
      >
        {BannerContent}
      </Link>
    );
  }

  return BannerContent;
}
