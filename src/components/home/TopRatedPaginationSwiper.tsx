"use client";

import { Swiper, SwiperSlide } from "swiper/react";
import { Pagination } from "swiper/modules";
import "swiper/css";
import "swiper/css/pagination";

import PublicProductCard from "@/components/product/PublicProductCard";
import { FullProduct } from "@/lib/types";
import { FadeIn } from "../animations/FadeIn";

type Props = {
  products: FullProduct[];
};

export default function TopRatedPaginationSwiper({ products }: Props) {
  return (
    <div className="space-y-4">
      <Swiper
        modules={[Pagination]}
        slidesPerView="auto"
        spaceBetween={16}
        grabCursor
        pagination={{
          clickable: true,
        }}
        className="w-full recently-swiper"
      >
        {products.map((product, index) => (
          <SwiperSlide key={product.id} className="!w-auto">
            <FadeIn delay={Math.min(index * 0.03, 0.24)}>
              <div
                className="
                  w-[160px]
                  sm:w-[180px]
                  md:w-[200px]
                  lg:w-[220px]
                  pb-10
                "
              >
                <PublicProductCard product={product} isWishlisted={false} />
              </div>
            </FadeIn>
          </SwiperSlide>
        ))}
      </Swiper>
    </div>
  );
}
