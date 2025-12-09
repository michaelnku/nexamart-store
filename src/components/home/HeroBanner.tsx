"use client";

import Image from "next/image";
import { useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

const banners = [
  "https://ijucjait38.ufs.sh/f/rO7LkXAj4RVlsVxoglS5IKehmVlg9HB2w0foaERyvYWz8TpM",
];

export default function HeroBanner() {
  const [index, setIndex] = useState(0);

  const next = () => setIndex((i) => (i + 1) % banners.length);
  const prev = () => setIndex((i) => (i - 1 + banners.length) % banners.length);

  return (
    <div className="relative h-[350px] w-full rounded-xl overflow-hidden shadow">
      <Image
        src={banners[index]}
        alt="banner"
        fill
        className="object-cover transition duration-500"
        loading="lazy"
      />
      <button
        onClick={prev}
        className="absolute left-4 top-1/2 -translate-y-1/2 p-2 rounded-full bg-black/40 hover:bg-black/60 text-white"
      >
        <ChevronLeft />
      </button>
      <button
        onClick={next}
        className="absolute right-4 top-1/2 -translate-y-1/2 p-2 rounded-full bg-black/40 hover:bg-black/60 text-white"
      >
        <ChevronRight />
      </button>
    </div>
  );
}
