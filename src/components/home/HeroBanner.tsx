"use client";

import { useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Autoplay, Pagination } from "swiper/modules";
import { Swiper, SwiperSlide } from "swiper/react";
import type { Swiper as SwiperType } from "swiper";
import "swiper/css";
import "swiper/css/pagination";

import { HeroBannerWithFiles } from "@/lib/types";

const AUTO_PLAY_DELAY = 8000;

export default function HeroBanner({
  banners,
}: {
  banners: HeroBannerWithFiles[];
}) {
  const [showControls, setShowControls] = useState(false);
  const swiperRef = useRef<SwiperType | null>(null);

  if (banners.length === 0) return null;

  return (
    <section
      className="
        group relative isolate w-full min-w-0 max-w-full overflow-hidden rounded-2xl
        h-[clamp(180px,52vw,250px)]
        sm:h-[clamp(240px,44vw,340px)]
        lg:h-[clamp(320px,48vh,520px)]
        xl:h-[clamp(360px,52vh,600px)]
      "
      onMouseEnter={() => {
        setShowControls(true);
        swiperRef.current?.autoplay?.stop();
      }}
      onMouseLeave={() => {
        setShowControls(false);
        swiperRef.current?.autoplay?.start();
      }}
    >
      <div className="absolute inset-0 animate-pulse bg-slate-200" />

      <Swiper
        modules={[Autoplay, Pagination]}
        onSwiper={(swiper) => {
          swiperRef.current = swiper;
        }}
        autoplay={
          banners.length > 1
            ? { delay: AUTO_PLAY_DELAY, disableOnInteraction: false }
            : false
        }
        loop={banners.length > 1}
        speed={700}
        grabCursor={banners.length > 1}
        pagination={
          banners.length > 1
            ? {
                clickable: true,
              }
            : false
        }
        className="hero-banner-swiper h-full w-full min-w-0 max-w-full overflow-hidden"
      >
        {banners.map((banner, index) => {
          const backgroundUrl =
            banner.backgroundImage?.url || "/fallback-banner.jpg";
          const productUrl = banner.productImage?.url ?? null;

          return (
            <SwiperSlide
              key={banner.id}
              className="!h-full !w-full min-w-0 overflow-hidden"
            >
              <div className="relative h-full w-full min-w-0 overflow-hidden">
                <Image
                  src={backgroundUrl}
                  alt={banner.title || "Banner"}
                  fill
                  priority={index === 0}
                  quality={75}
                  sizes="(min-width: 1280px) calc(100vw - 360px), (min-width: 1024px) calc(100vw - 300px), 100vw"
                  className="object-cover"
                />

                <div className="absolute inset-0 bg-gradient-to-t from-black/55 via-black/10 to-transparent sm:from-black/45 lg:bg-gradient-to-r lg:from-black/60 lg:via-black/20 lg:to-transparent" />

                <div className="relative z-10 flex h-full w-full min-w-0 items-end px-3 pb-5 sm:px-5 sm:pb-6 md:px-6 lg:items-center lg:px-10 lg:pb-0 xl:px-16">
                  <div className="flex w-full min-w-0 items-end lg:items-center lg:justify-between lg:gap-8">
                    <div
                      className="
                        min-w-0 max-w-[min(12rem,calc(100vw-2rem))] rounded-2xl bg-black/20 px-3 py-3 text-white
                        backdrop-blur-[2px]
                        sm:max-w-[15rem] sm:px-4 sm:py-4 md:max-w-xs
                        lg:max-w-xl lg:bg-transparent lg:px-0 lg:py-0 lg:backdrop-blur-0
                      "
                    >
                      {banner.title ? (
                        <h1 className="line-clamp-2 overflow-hidden break-words text-sm font-semibold leading-snug sm:text-lg md:text-xl lg:text-4xl lg:font-bold xl:text-5xl">
                          {banner.title}
                        </h1>
                      ) : null}

                      {banner.subtitle ? (
                        <p className="mt-4 hidden max-w-lg text-lg text-white/90 lg:block">
                          {banner.subtitle}
                        </p>
                      ) : null}

                      {banner.ctaText && banner.ctaLink ? (
                        <Link
                          href={banner.ctaLink}
                          className="
                            mt-3 inline-flex max-w-full items-center rounded-full bg-white/95 px-3 py-1.5
                            text-xs font-semibold text-slate-950 transition hover:bg-white
                            sm:px-4 sm:py-2
                            lg:mt-5 lg:text-sm
                          "
                        >
                          <span className="truncate">{banner.ctaText}</span>
                        </Link>
                      ) : null}
                    </div>

                    {productUrl ? (
                      <div className="hidden min-w-0 flex-1 justify-end lg:flex">
                        <Image
                          src={productUrl}
                          alt="Product"
                          width={460}
                          height={460}
                          className="max-h-[78%] w-auto max-w-[42vw] object-contain drop-shadow-2xl"
                        />
                      </div>
                    ) : null}
                  </div>
                </div>
              </div>
            </SwiperSlide>
          );
        })}
      </Swiper>

      {banners.length > 1 ? (
        <>
          <button
            type="button"
            aria-label="Previous banner"
            onClick={() => swiperRef.current?.slidePrev()}
            className="
              absolute left-4 top-1/2 z-20 hidden -translate-y-1/2 rounded-full
              bg-white/85 p-3 text-slate-900 shadow-md transition-all lg:flex
            "
            style={{
              opacity: showControls ? 1 : 0,
              pointerEvents: showControls ? "auto" : "none",
            }}
          >
            <ChevronLeft size={20} />
          </button>

          <button
            type="button"
            aria-label="Next banner"
            onClick={() => swiperRef.current?.slideNext()}
            className="
              absolute right-4 top-1/2 z-20 hidden -translate-y-1/2 rounded-full
              bg-white/85 p-3 text-slate-900 shadow-md transition-all lg:flex
            "
            style={{
              opacity: showControls ? 1 : 0,
              pointerEvents: showControls ? "auto" : "none",
            }}
          >
            <ChevronRight size={20} />
          </button>
        </>
      ) : null}
    </section>
  );
}
