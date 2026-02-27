"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";

type Banner = {
  id: string;
  title: string;
  subtitle?: string | null;
  ctaText?: string | null;
  ctaLink?: string | null;
  backgroundImage: string;
  productImage?: string | null;
  lottieUrl?: string | null;
};

export default function HeroBanner({ banners }: { banners: Banner[] }) {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    if (banners.length <= 1) return;
    const id = setInterval(() => {
      setIndex((prev) => (prev + 1) % banners.length);
    }, 8000);
    return () => clearInterval(id);
  }, [banners.length]);

  if (!banners.length) return null;

  const banner = banners[index];

  return (
    <div className="relative w-full h-[260px] sm:h-[340px] lg:h-full rounded-2xl overflow-hidden">
      <AnimatePresence mode="wait">
        <motion.div
          key={banner.id}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.8 }}
          className="absolute inset-0"
        >
          <Image
            src={banner.backgroundImage}
            alt={banner.title}
            fill
            priority
            className="object-cover"
          />
        </motion.div>
      </AnimatePresence>

      <div className="absolute inset-0 bg-gradient-to-br from-[#3c9ee0]/90 via-[#1f6fb2]/80 to-black/70" />

      <div className="relative z-10 h-full flex items-center px-8">
        <div className="max-w-xl text-white space-y-4">
          <motion.h1
            key={banner.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-3xl font-bold"
          >
            {banner.title}
          </motion.h1>

          {banner.subtitle && (
            <p className="text-white/90">{banner.subtitle}</p>
          )}

          {banner.ctaText && banner.ctaLink && (
            <Link
              href={banner.ctaLink}
              className="inline-block bg-white text-[#3c9ee0] font-semibold px-6 py-2 rounded-xl hover:scale-105 transition"
            >
              {banner.ctaText}
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}

// "use client";

// import { useEffect, useState } from "react";
// import Image from "next/image";
// import Link from "next/link";
// import { motion, AnimatePresence } from "framer-motion";
// import { ChevronLeft, ChevronRight } from "lucide-react";
// import { DotLottieReact } from "@lottiefiles/dotlottie-react";

// type Banner = {
//   id: string;
//   title: string;
//   subtitle: string;
//   ctaText: string;
//   ctaLink: string;
//   backgroundImage: string;
//   productImage?: string;
//   lottieUrl?: string;
// };

// const banners: Banner[] = [
//   {
//     id: "1",
//     title: "NexaMart Seasonal Sale",
//     subtitle: "Up to 50% Off • Limited Time Only",
//     ctaText: "Shop Now",
//     ctaLink: "/sale",
//     backgroundImage:
//       "https://ijucjait38.ufs.sh/f/rO7LkXAj4RVlsVxoglS5IKehmVlg9HB2w0foaERyvYWz8TpM",
//     lottieUrl: "",
//   },
// ];

// export default function HeroBanner() {
//   const [index, setIndex] = useState(0);

//   const next = () => setIndex((prev) => (prev + 1) % banners.length);

//   const prev = () =>
//     setIndex((prev) => (prev - 1 + banners.length) % banners.length);

//   useEffect(() => {
//     if (banners.length <= 1) return;
//     const id = setInterval(next, 8000);
//     return () => clearInterval(id);
//   }, []);

//   const banner = banners[index];

//   return (
//     <div className="relative w-full h-[260px] sm:h-[340px] lg:h-full rounded-2xl overflow-hidden shadow-sm">
//       {/* Animated Gradient Layer */}
//       <div className="absolute inset-0 bg-gradient-to-br from-[#3c9ee0]/90 via-[#1f6fb2]/80 to-black/70 animate-gradientShift z-10" />

//       {/* Background Image */}
//       <AnimatePresence mode="wait">
//         <motion.div
//           key={banner.id}
//           initial={{ opacity: 0, scale: 1.02 }}
//           animate={{ opacity: 1, scale: 1 }}
//           exit={{ opacity: 0 }}
//           transition={{ duration: 0.8 }}
//           className="absolute inset-0"
//         >
//           <Image
//             src={banner.backgroundImage}
//             alt={banner.title}
//             fill
//             priority
//             className="object-cover"
//           />
//         </motion.div>
//       </AnimatePresence>

//       {/* Content */}
//       <div className="relative z-20 h-full flex items-center px-6 md:px-10">
//         <div className="max-w-xl text-white space-y-4">
//           <AnimatePresence mode="wait">
//             <motion.div
//               key={banner.title}
//               initial={{ opacity: 0, y: 25 }}
//               animate={{ opacity: 1, y: 0 }}
//               exit={{ opacity: 0 }}
//               transition={{ duration: 0.6 }}
//               className="space-y-3"
//             >
//               <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold leading-tight">
//                 {banner.title}
//               </h1>

//               <p className="text-sm sm:text-base text-white/90">
//                 {banner.subtitle}
//               </p>

//               <Link
//                 href={banner.ctaLink}
//                 className="inline-block bg-white text-[#3c9ee0] font-semibold px-6 py-2.5 rounded-xl shadow-md hover:scale-105 transition"
//               >
//                 {banner.ctaText}
//               </Link>
//             </motion.div>
//           </AnimatePresence>
//         </div>

//         {/* Optional Lottie Accent */}
//         {banner.lottieUrl && (
//           <div className="absolute right-6 bottom-6 w-24 h-24 opacity-80 hidden md:block">
//             <DotLottieReact src={banner.lottieUrl} loop autoplay />
//           </div>
//         )}
//       </div>

//       {/* Controls */}
//       {banners.length > 1 && (
//         <>
//           <button
//             onClick={prev}
//             className="absolute left-4 top-1/2 -translate-y-1/2 z-30 p-2 rounded-full bg-black/40 text-white hover:bg-black/60"
//           >
//             <ChevronLeft />
//           </button>

//           <button
//             onClick={next}
//             className="absolute right-4 top-1/2 -translate-y-1/2 z-30 p-2 rounded-full bg-black/40 text-white hover:bg-black/60"
//           >
//             <ChevronRight />
//           </button>
//         </>
//       )}
//     </div>
//   );
// }
