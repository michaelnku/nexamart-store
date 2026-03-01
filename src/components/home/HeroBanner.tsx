"use client";

import { useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Swiper, SwiperSlide } from "swiper/react";
import { Navigation, Autoplay, EffectFade } from "swiper/modules";
import "swiper/css";
import "swiper/css/navigation";
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
        h-[260px]
        sm:h-[340px]
        lg:h-[45vh]
        xl:h-[50vh]
        2xl:h-[55vh]
        rounded-2xl overflow-hidden
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
      {/* Desktop Navigation Buttons */}
      {showNav && banners.length > 1 && (
        <>
          <button
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
        modules={[Navigation, Autoplay, EffectFade]}
        effect="fade"
        fadeEffect={{ crossFade: true }}
        onSwiper={(swiper) => (swiperRef.current = swiper)}
        autoplay={{
          delay: 6000,
          disableOnInteraction: false,
        }}
        loop={banners.length > 1}
        speed={900}
        grabCursor
        className="h-full"
      >
        {banners.map((banner) => {
          const backgroundUrl =
            banner.backgroundImage?.url || "/fallback-banner.jpg";

          const productUrl = banner.productImage?.url ?? null;

          const SlideContent = (
            <div className="relative w-full h-full">
              {/* Background */}
              <Image
                src={backgroundUrl}
                alt={banner.title || "Banner"}
                fill
                priority
                sizes="(max-width: 768px) 100vw, 70vw"
                className="object-cover"
              />

              {/* Overlay */}
              <div className="absolute inset-0 bg-black/25" />

              {/* Content */}
              <div className="relative z-20 h-full flex items-center justify-between px-6 sm:px-8 lg:px-12">
                <div className="max-w-xl text-white space-y-5">
                  <h1 className="text-2xl sm:text-3xl lg:text-4xl xl:text-5xl font-bold leading-tight">
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

                {productUrl && (
                  <div className="hidden lg:flex items-center justify-center">
                    <Image
                      src={productUrl}
                      alt="Product"
                      width={420}
                      height={420}
                      className="object-contain drop-shadow-2xl"
                    />
                  </div>
                )}
              </div>
            </div>
          );

          return (
            <SwiperSlide key={banner.id}>
              {banner.ctaLink ? (
                <Link href={banner.ctaLink} className="block h-full">
                  {SlideContent}
                </Link>
              ) : (
                SlideContent
              )}
            </SwiperSlide>
          );
        })}
      </Swiper>
    </div>
  );
}
