"use client";

import { Swiper, SwiperSlide } from "swiper/react";
import { Pagination } from "swiper/modules";
import "swiper/css";
import "swiper/css/pagination";

import PublicProductCard from "@/components/product/PublicProductCard";
import { ProductCardType } from "@/lib/types";

type Props = {
  products: ProductCardType[];
};

export default function RecentlyViewedPaginationSwiper({ products }: Props) {
  return (
    <div className="space-y-4">
      <Swiper
        modules={[Pagination]}
        slidesPerView={"auto"}
        spaceBetween={16}
        grabCursor
        pagination={{
          clickable: true,
        }}
        className="w-full recently-swiper"
      >
        <>
          {products.map((product) => (
            <SwiperSlide key={product.id} className="!w-auto">
              <div
                className="
                w-[160px]
                sm:w-[180px]
                md:w-[200px]
                lg:w-[220px]
                pb-10
              "
              >
                <PublicProductCard product={product} />
              </div>
            </SwiperSlide>
          ))}
        </>
      </Swiper>
    </div>
  );
}
