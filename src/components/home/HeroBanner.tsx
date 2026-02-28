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

  const bannerCount = banners.length;

  useEffect(() => {
    if (bannerCount <= 1) return;

    const interval = setInterval(() => {
      paginate(1);
    }, 9000);

    return () => clearInterval(interval);
  }, [bannerCount]);

  if (!bannerCount) return null;

  const paginate = (newDirection: number) => {
    setIndex(([prev]) => [
      (prev + newDirection + bannerCount) % bannerCount,
      newDirection,
    ]);
  };

  const banner = banners[index];

  const backgroundUrl = banner.backgroundImage?.url || "/fallback-banner.jpg";

  const productUrl = banner.productImage?.url ?? null;

  const swipePower = (offset: number, velocity: number) =>
    Math.abs(offset) * velocity;

  const swipeThreshold = 10000;

  const BannerContent = (
    <div
      className="
        relative w-full
        h-[260px]
        sm:h-[340px]
        lg:h-[45vh]
        xl:h-[50vh]
        2xl:h-[55vh]
        rounded-2xl overflow-hidden
        cursor-pointer group
      "
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {/* Background Slide */}
      <AnimatePresence initial={false} custom={direction}>
        <motion.div
          key={index}
          custom={direction}
          initial={{
            x: direction > 0 ? 100 : -100,
            opacity: 0,
          }}
          animate={{
            x: 0,
            opacity: 1,
          }}
          exit={{
            x: direction < 0 ? 100 : -100,
            opacity: 0,
          }}
          transition={{
            x: { type: "spring", stiffness: 260, damping: 30 },
            opacity: { duration: 0.6 },
          }}
          drag="x"
          dragConstraints={{ left: 0, right: 0 }}
          dragElastic={0.5}
          onDragEnd={(_, info: PanInfo) => {
            const swipe = swipePower(info.offset.x, info.velocity.x);

            if (swipe < -swipeThreshold) paginate(1);
            else if (swipe > swipeThreshold) paginate(-1);
          }}
          className="absolute inset-0"
        >
          <Image
            src={backgroundUrl}
            alt={banner.title || "Banner"}
            fill
            priority
            sizes="(max-width: 768px) 100vw, 70vw"
            className="object-cover"
          />
        </motion.div>
      </AnimatePresence>

      {/* Overlay */}
      <div className="absolute inset-0 bg-black/25" />

      {/* Text + Product */}
      <div className="relative z-10 h-full flex items-center justify-between px-6 sm:px-8 lg:px-12">
        <div className="max-w-xl text-white space-y-5">
          <motion.h1
            key={`title-${index}`}
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-2xl sm:text-3xl lg:text-4xl xl:text-5xl font-bold leading-tight"
          >
            {banner.title}
          </motion.h1>

          {banner.subtitle && (
            <motion.p
              key={`subtitle-${index}`}
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.15 }}
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
              transition={{ duration: 0.8, delay: 0.3 }}
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
            transition={{ duration: 0.8, delay: 0.2 }}
            className="hidden lg:flex items-center justify-center"
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

      {/* Desktop Buttons (Fade on Hover) */}
      {bannerCount > 1 && (
        <>
          <motion.button
            initial={{ opacity: 0 }}
            animate={{ opacity: hovered ? 1 : 0 }}
            transition={{ duration: 0.3 }}
            onClick={(e) => {
              e.preventDefault();
              paginate(-1);
            }}
            className="
              hidden lg:flex
              absolute left-4 top-1/2 -translate-y-1/2
              bg-white/80 backdrop-blur-sm
              p-3 rounded-full shadow-md
              hover:bg-white
            "
          >
            <ChevronLeft size={22} />
          </motion.button>

          <motion.button
            initial={{ opacity: 0 }}
            animate={{ opacity: hovered ? 1 : 0 }}
            transition={{ duration: 0.3 }}
            onClick={(e) => {
              e.preventDefault();
              paginate(1);
            }}
            className="
              hidden lg:flex
              absolute right-4 top-1/2 -translate-y-1/2
              bg-white/80 backdrop-blur-sm
              p-3 rounded-full shadow-md
              hover:bg-white
            "
          >
            <ChevronRight size={22} />
          </motion.button>
        </>
      )}
    </div>
  );

  if (banner.ctaLink) {
    return (
      <Link
        href={banner.ctaLink}
        className="block rounded-2xl focus:outline-none focus:ring-2 focus:ring-[#3c9ee0]"
      >
        {BannerContent}
      </Link>
    );
  }

  return BannerContent;
}
