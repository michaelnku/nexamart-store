"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

const banners = [
  "https://ijucjait38.ufs.sh/f/rO7LkXAj4RVlsVxoglS5IKehmVlg9HB2w0foaERyvYWz8TpM",
];

export default function HeroBanner() {
  const [index, setIndex] = useState(0);

  const next = () => setIndex((i) => (i + 1) % banners.length);
  const prev = () => setIndex((i) => (i - 1 + banners.length) % banners.length);

  useEffect(() => {
    if (banners.length <= 1) return;
    const id = setInterval(() => {
      setIndex((i) => (i + 1) % banners.length);
    }, 6000);
    return () => clearInterval(id);
  }, []);

  return (
    <div
      className="
        relative w-full 
    h-[220px] sm:h-[300px] md:h-[340px] lg:h-full
        rounded-xl overflow-hidden shadow-sm
        dark:bg-neutral-900
      "
    >
      <Image
        src={banners[index]}
        alt="Promotional banner"
        fill
        priority
        sizes="(min-width: 1024px) 75vw, 100vw"
        className="object-cover transition duration-500"
      />

      <button
        aria-label="Previous banner"
        onClick={prev}
        className="absolute left-3 top-1/2 -translate-y-1/2
                   p-2 rounded-full bg-black/40 hover:bg-black/60 text-white"
      >
        <ChevronLeft />
      </button>

      <button
        aria-label="Next banner"
        onClick={next}
        className="absolute right-3 top-1/2 -translate-y-1/2
                   p-2 rounded-full bg-black/40 hover:bg-black/60 text-white"
      >
        <ChevronRight />
      </button>
    </div>
  );
}
