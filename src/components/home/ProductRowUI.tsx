"use client";

import { useRef, useState } from "react";
import { Swiper, SwiperSlide } from "swiper/react";
import { Navigation, Autoplay } from "swiper/modules";
import "swiper/css";
import "swiper/css/navigation";

import PublicProductCard from "@/components/product/PublicProductCard";
import { FullProduct } from "@/lib/types";
import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import type { Swiper as SwiperType } from "swiper";
import { FadeIn } from "../animations/FadeIn";

type Props = {
  title: string;
  products: FullProduct[];
  seeAllLink?: string;
  autoplay?: boolean;
};

export default function ProductRowUI({
  title,
  products,
  seeAllLink,
  autoplay = true,
}: Props) {
  const [showNav, setShowNav] = useState(false);
  const swiperRef = useRef<SwiperType | null>(null);

  if (products.length === 0) return null;

  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between px-1">
        <h2 className="text-lg font-semibold">{title}</h2>
        {seeAllLink && (
          <Link
            href={seeAllLink}
            className="text-[var(--brand-blue)] text-sm hover:underline font-medium"
          >
            Explore
          </Link>
        )}
      </div>

      <div
        className="relative"
        onMouseEnter={() => {
          setShowNav(true);
          if (autoplay) swiperRef.current?.autoplay?.stop();
        }}
        onMouseLeave={() => {
          setShowNav(false);
          if (autoplay) swiperRef.current?.autoplay?.start();
        }}
      >
        {showNav && (
          <button
            onClick={() => swiperRef.current?.slidePrev()}
            className="absolute left-2 top-1/2 -translate-y-1/2 z-20 p-2 rounded-full 
            bg-black/40 hover:bg-black/60 text-white transition shadow hidden md:flex"
          >
            <ChevronLeft />
          </button>
        )}

        {showNav && (
          <button
            onClick={() => swiperRef.current?.slideNext()}
            className="absolute right-2 top-1/2 -translate-y-1/2 z-20 p-2 rounded-full 
            bg-black/40 hover:bg-black/60 text-white transition shadow hidden md:flex"
          >
            <ChevronRight />
          </button>
        )}

        <Swiper
          modules={[Navigation, Autoplay]}
          onSwiper={(swiper) => (swiperRef.current = swiper)}
          autoplay={
            autoplay ? { delay: 4000, disableOnInteraction: false } : false
          }
          loop={products.length > 6}
          slidesPerView="auto"
          slidesPerGroup={1}
          spaceBetween={18}
          speed={600}
          grabCursor
          className="pb-10 px-1"
        >
          {products.map((p, i) => (
            <SwiperSlide key={p.id} className="!w-auto">
              <FadeIn delay={i * 0.04}>
                <div
                  className="
            w-[160px]
            sm:w-[180px]
            md:w-[200px]
            lg:w-[220px]
          "
                >
                  <PublicProductCard product={p} isWishlisted={false} />
                </div>
              </FadeIn>
            </SwiperSlide>
          ))}
        </Swiper>
      </div>
    </section>
  );
}
