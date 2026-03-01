"use client";

import { useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Swiper, SwiperSlide } from "swiper/react";
import { Autoplay, EffectFade } from "swiper/modules";
import "swiper/css";
import "swiper/css/effect-fade";

import { ChevronLeft, ChevronRight } from "lucide-react";
import type { Swiper as SwiperType } from "swiper";
import { HeroBannerWithFiles } from "@/lib/types";

export default function HeroBanner({
  banners,
}: {
  banners: HeroBannerWithFiles[];
}) {
  const swiperRef = useRef<SwiperType | null>(null);
  const [showNav, setShowNav] = useState(false);

  if (!banners.length) return null;

  return (
    <div
      className="
        relative w-full
        rounded-2xl overflow-hidden
        min-h-[260px]
        sm:min-h-[340px]
        lg:min-h-[420px]
        xl:min-h-[500px]
      "
      onMouseEnter={() => {
        setShowNav(true);
        swiperRef.current?.autoplay?.stop();
      }}
      onMouseLeave={() => {
        setShowNav(false);
        swiperRef.current?.autoplay?.start();
      }}
    >
      {/* Navigation Buttons (Desktop Only) */}
      {showNav && banners.length > 1 && (
        <>
          <button
            type="button"
            onClick={() => swiperRef.current?.slidePrev()}
            className="
              hidden lg:flex
              absolute left-4 top-1/2 -translate-y-1/2
              z-30 p-3 rounded-full
              bg-white/80 backdrop-blur-sm
              shadow-md hover:bg-white transition
            "
          >
            <ChevronLeft size={22} />
          </button>

          <button
            type="button"
            onClick={() => swiperRef.current?.slideNext()}
            className="
              hidden lg:flex
              absolute right-4 top-1/2 -translate-y-1/2
              z-30 p-3 rounded-full
              bg-white/80 backdrop-blur-sm
              shadow-md hover:bg-white transition
            "
          >
            <ChevronRight size={22} />
          </button>
        </>
      )}

      <Swiper
        modules={[Autoplay, EffectFade]}
        effect="fade"
        fadeEffect={{ crossFade: true }}
        onSwiper={(swiper) => (swiperRef.current = swiper)}
        autoplay={{
          delay: 6000,
          disableOnInteraction: false,
        }}
        loop={banners.length > 1}
        speed={900}
        className="h-full"
      >
        {banners.map((banner) => {
          const backgroundUrl =
            banner.backgroundImage?.url || "/fallback-banner.jpg";

          const productUrl = banner.productImage?.url ?? null;

          const SlideInner = (
            <div className="relative w-full h-full min-h-inherit">
              {/* Background Image */}
              <div className="absolute inset-0">
                <Image
                  src={backgroundUrl}
                  alt={banner.title || "Banner"}
                  fill
                  priority
                  sizes="100vw"
                  className="object-cover"
                />
              </div>

              {/* Subtle Overlay */}
              <div className="absolute inset-0 bg-black/30" />

              {/* Content */}
              <div className="relative z-20 h-full flex flex-col lg:flex-row items-center justify-between px-6 sm:px-8 lg:px-12 py-8 gap-6">
                {/* Text */}
                <div className="max-w-xl text-white space-y-4 text-center lg:text-left">
                  <h1 className="text-2xl sm:text-3xl md:text-4xl xl:text-5xl font-bold leading-tight">
                    {banner.title}
                  </h1>

                  {banner.subtitle && (
                    <p className="text-white/90 text-sm sm:text-base lg:text-lg">
                      {banner.subtitle}
                    </p>
                  )}

                  {banner.ctaText && (
                    <span className="inline-block bg-white text-[#3c9ee0] font-semibold px-6 py-2 rounded-xl shadow-md">
                      {banner.ctaText}
                    </span>
                  )}
                </div>

                {/* Product Image */}
                {productUrl && (
                  <div className="hidden lg:flex items-center justify-center flex-1">
                    <Image
                      src={productUrl}
                      alt="Product"
                      width={420}
                      height={420}
                      className="object-contain drop-shadow-2xl max-h-[420px] w-auto h-auto"
                    />
                  </div>
                )}
              </div>
            </div>
          );

          return (
            <SwiperSlide key={banner.id} className="!h-full">
              {banner.ctaLink ? (
                <Link href={banner.ctaLink} className="block h-full">
                  {SlideInner}
                </Link>
              ) : (
                SlideInner
              )}
            </SwiperSlide>
          );
        })}
      </Swiper>
    </div>
  );
}
