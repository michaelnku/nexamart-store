"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { motion, AnimatePresence, PanInfo } from "framer-motion";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { HeroBannerWithFiles } from "@/lib/types";

export default function HeroBanner({
  banners,
}: {
  banners: HeroBannerWithFiles[];
}) {
  const [[index, direction], setIndex] = useState<[number, number]>([0, 0]);
  const [hovered, setHovered] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

  const bannerCount = banners.length;

  const paginate = (newDirection: number) => {
    setIndex(([prev]) => [
      (prev + newDirection + bannerCount) % bannerCount,
      newDirection,
    ]);
  };

  useEffect(() => {
    if (bannerCount <= 1) return;

    const interval = setInterval(() => {
      paginate(1);
    }, 9000);

    return () => clearInterval(interval);
  }, [bannerCount]);

  if (!bannerCount) return null;

  const banner = banners[index];
  const backgroundUrl = banner.backgroundImage?.url || "/fallback-banner.jpg";
  const productUrl = banner.productImage?.url ?? null;

  // 👇 pixel-based threshold (much more reliable)
  const swipeThreshold = 80;

  return (
    <div
      className="
        relative w-full
        h-[260px]
        sm:h-[340px]
        lg:h-[45vh]
        xl:h-[50vh]
        2xl:h-[55vh]
        rounded-2xl overflow-hidden
        group
      "
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <AnimatePresence initial={false} custom={direction}>
        <motion.div
          key={index}
          custom={direction}
          initial={{
            x: direction > 0 ? 150 : -150,
            opacity: 0,
          }}
          animate={{
            x: 0,
            opacity: 1,
          }}
          exit={{
            x: direction < 0 ? 150 : -150,
            opacity: 0,
          }}
          transition={{
            x: { type: "spring", stiffness: 260, damping: 30 },
            opacity: { duration: 0.4 },
          }}
          drag="x"
          dragConstraints={{ left: 0, right: 0 }}
          dragElastic={0.2}
          onDragStart={() => setIsDragging(true)}
          onDragEnd={(_, info: PanInfo) => {
            const offset = info.offset.x;

            if (offset < -swipeThreshold) paginate(1);
            else if (offset > swipeThreshold) paginate(-1);

            // small delay to prevent accidental link click
            setTimeout(() => setIsDragging(false), 120);
          }}
          className="absolute inset-0 cursor-grab active:cursor-grabbing"
        >
          <Image
            src={backgroundUrl}
            alt={banner.title || "Banner"}
            fill
            priority
            sizes="100vw"
            className="object-cover"
          />
        </motion.div>
      </AnimatePresence>

      {/* Overlay */}
      <div className="absolute inset-0 bg-black/25 pointer-events-none" />

      {/* Click Layer (disabled while dragging) */}
      {banner.ctaLink && !isDragging && (
        <Link href={banner.ctaLink} className="absolute inset-0 z-10" />
      )}

      {/* Content */}
      <div className="relative z-20 h-full flex items-center justify-between px-6 sm:px-8 lg:px-12 pointer-events-none">
        <div className="max-w-xl text-white space-y-5 pointer-events-auto">
          <motion.h1
            key={`title-${index}`}
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-2xl sm:text-3xl lg:text-4xl xl:text-5xl font-bold leading-tight"
          >
            {banner.title}
          </motion.h1>

          {banner.subtitle && (
            <motion.p
              key={`subtitle-${index}`}
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="text-white/90 text-sm sm:text-base lg:text-lg"
            >
              {banner.subtitle}
            </motion.p>
          )}

          {banner.ctaText && (
            <motion.span
              key={`cta-${index}`}
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="inline-block bg-white text-[#3c9ee0] font-semibold px-6 py-2 rounded-xl shadow-md"
            >
              {banner.ctaText}
            </motion.span>
          )}
        </div>

        {productUrl && (
          <motion.div
            key={`product-${index}`}
            initial={{ opacity: 0, x: 60 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.15 }}
            className="hidden lg:flex items-center justify-center pointer-events-none"
          >
            <Image
              src={productUrl}
              alt="Product"
              width={420}
              height={420}
              className="object-contain drop-shadow-2xl"
            />
          </motion.div>
        )}
      </div>

      {/* Desktop Arrows */}
      {bannerCount > 1 && (
        <>
          <motion.button
            type="button"
            initial={{ opacity: 0 }}
            animate={{ opacity: hovered ? 1 : 0 }}
            transition={{ duration: 0.2 }}
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              paginate(-1);
            }}
            className="
              hidden lg:flex
              absolute left-4 top-1/2 -translate-y-1/2
              bg-white/80 backdrop-blur-sm
              p-3 rounded-full shadow-md
              hover:bg-white
              z-30
            "
          >
            <ChevronLeft size={22} />
          </motion.button>

          <motion.button
            type="button"
            initial={{ opacity: 0 }}
            animate={{ opacity: hovered ? 1 : 0 }}
            transition={{ duration: 0.2 }}
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              paginate(1);
            }}
            className="
              hidden lg:flex
              absolute right-4 top-1/2 -translate-y-1/2
              bg-white/80 backdrop-blur-sm
              p-3 rounded-full shadow-md
              hover:bg-white
              z-30
            "
          >
            <ChevronRight size={22} />
          </motion.button>
        </>
      )}
    </div>
  );
}
