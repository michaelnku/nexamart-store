"use client";

import { useEffect, useState, useCallback } from "react";
import Image from "next/image";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { HeroBannerWithFiles } from "@/lib/types";

const SWIPE_THRESHOLD = 80;
const AUTO_PLAY_DELAY = 8000;

export default function HeroBanner({
  banners,
}: {
  banners: HeroBannerWithFiles[];
}) {
  const [[index, direction], setIndex] = useState<[number, number]>([0, 0]);
  const [isDragging, setIsDragging] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [showControls, setShowControls] = useState(false);

  const bannerCount = banners.length;

  const paginate = useCallback(
    (newDirection: number) => {
      setIndex(([prev]) => [
        (prev + newDirection + bannerCount) % bannerCount,
        newDirection,
      ]);
    },
    [bannerCount],
  );

  const goTo = useCallback(
    (nextIndex: number) => {
      if (nextIndex === index) return;
      const nextDirection = nextIndex > index ? 1 : -1;
      setIndex([nextIndex, nextDirection]);
    },
    [index],
  );

  // Smart autoplay (pause on hover or drag)
  useEffect(() => {
    if (bannerCount <= 1 || isHovered || isDragging) return;

    const interval = setInterval(() => {
      paginate(1);
    }, AUTO_PLAY_DELAY);

    return () => clearInterval(interval);
  }, [bannerCount, isHovered, isDragging, paginate]);

  if (!bannerCount) return null;

  const banner = banners[index];
  const backgroundUrl = banner.backgroundImage?.url || "/fallback-banner.jpg";
  const productUrl = banner.productImage?.url ?? null;

  return (
    <div
      className="
        relative w-full
        h-[260px]
        sm:h-[360px]
        lg:h-[48vh]
        xl:h-[52vh]
        2xl:h-[58vh]
        rounded-2xl overflow-hidden
        group
              "
      style={{ touchAction: "pan-y" }}
      onMouseEnter={() => {
        setIsHovered(true);
        setShowControls(true);
      }}
      onMouseLeave={() => {
        setIsHovered(false);
        setShowControls(false);
      }}
    >
      <div className="absolute inset-0 bg-gray-200 animate-pulse" />

      {/* Slides */}
      <AnimatePresence initial={false} custom={direction} mode="wait">
        <motion.div
          key={index}
          custom={direction}
          initial={{ x: direction > 0 ? 200 : -200, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          exit={{ x: direction < 0 ? 200 : -200, opacity: 0 }}
          transition={{
            x: { type: "spring", stiffness: 260, damping: 30 },
            opacity: { duration: 0.35 },
          }}
          drag="x"
          dragConstraints={{ left: 0, right: 0 }}
          dragElastic={0.25}
          onDragStart={() => setIsDragging(true)}
          onDragEnd={(_, info) => {
            const offset = info.offset.x;

            if (offset < -SWIPE_THRESHOLD) paginate(1);
            else if (offset > SWIPE_THRESHOLD) paginate(-1);

            setTimeout(() => setIsDragging(false), 100);
          }}
          className="absolute inset-0"
        >
          <Image
            src={backgroundUrl}
            alt={banner.title || "Banner"}
            fill
            priority={index === 0}
            quality={75}
            sizes="100vw"
            className="object-cover cursor-grab active:cursor-grabbing"
          />
        </motion.div>
      </AnimatePresence>

      {/* Overlay */}
      <div className="absolute inset-0 bg-gradient-to-r from-black/60 via-black/30 to-black/10" />

      {/* Clickable Layer */}
      {banner.ctaLink && !isDragging && (
        <Link href={banner.ctaLink} className="absolute inset-0 z-10" />
      )}

      {/* Content */}
      <div className="relative z-20 h-full flex items-center justify-between px-6 sm:px-10 lg:px-16">
        <div className="max-w-xl text-white space-y-5">
          <motion.h1
            key={`title-${index}`}
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-2xl sm:text-3xl lg:text-4xl xl:text-5xl font-bold leading-tight"
          >
            {banner.title}
          </motion.h1>

          {banner.subtitle && (
            <motion.p
              key={`subtitle-${index}`}
              initial={{ opacity: 0, y: 40 }}
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
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="
                inline-block
                bg-white
                text-[#3c9ee0]
                font-semibold
                px-6 py-2.5
                rounded-xl
                shadow-lg
                hover:scale-105
                transition-transform
              "
            >
              {banner.ctaText}
            </motion.span>
          )}
        </div>

        {productUrl && (
          <motion.div
            key={`product-${index}`}
            initial={{ opacity: 0, x: 80 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.15 }}
            className="hidden lg:flex items-center justify-center"
          >
            <Image
              src={productUrl}
              alt="Product"
              width={460}
              height={460}
              className="object-contain drop-shadow-2xl"
            />
          </motion.div>
        )}
      </div>

      {/* Desktop Navigation Arrows */}
      {bannerCount > 1 && (
        <>
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              paginate(-1);
            }}
            className="
              hidden lg:flex
              absolute left-6 top-1/2 -translate-y-1/2
              bg-white/80 backdrop-blur-md
              p-3 rounded-full
              shadow-md
              hover:bg-white
              hover:scale-105
              transition-all
              z-30
              pointer-events-none
            "
            style={{
              opacity: showControls ? 1 : 0,
              pointerEvents: showControls ? "auto" : "none",
            }}
          >
            <ChevronLeft size={22} />
          </button>

          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              paginate(1);
            }}
            className="
              hidden lg:flex
              absolute right-6 top-1/2 -translate-y-1/2
              bg-white/80 backdrop-blur-md
              p-3 rounded-full
              shadow-md
              hover:bg-white
              hover:scale-105
              transition-all
              z-30
              pointer-events-none
            "
            style={{
              opacity: showControls ? 1 : 0,
              pointerEvents: showControls ? "auto" : "none",
            }}
          >
            <ChevronRight size={22} />
          </button>

          <div
            className="
              absolute bottom-4 left-1/2 -translate-x-1/2
              flex items-center gap-2
              z-30
            "
          >
            {banners.map((_, dotIndex) => {
              const isActive = dotIndex === index;

              return (
                <button
                  key={dotIndex}
                  type="button"
                  aria-label={`Go to banner ${dotIndex + 1}`}
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    goTo(dotIndex);
                  }}
                  className="h-2.5 rounded-full transition-all"
                  style={{
                    width: isActive ? "1.6rem" : "0.6rem",
                    backgroundColor: isActive ? "var(--brand-blue)" : "#cbd5e1",
                    opacity: isActive ? 1 : 0.9,
                  }}
                />
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
