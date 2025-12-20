import Image from "next/image";

export default function Loading() {
  return (
    <main className="fixed inset-0 z-[9999] bg-white dark:bg-neutral-950 flex flex-col justify-between items-center px-6 py-10 overscroll-none touch-none fade-out animate-splash">
      {/* TOP LOGO */}
      <header className="flex justify-center items-center w-full mt-8 sm:mt-14">
        <h1 className="text-4xl font-extrabold tracking-wide md:text-5xl">
          Nexa<span className="text-[#3c9ee0]">Mart</span>
        </h1>
      </header>

      {/* CENTER LOADER */}
      <div className="flex flex-col items-center gap-6">
        <Image
          src="https://ijucjait38.ufs.sh/f/rO7LkXAj4RVlnNw2KuOByscQRmqV3jX4rStz8G2Mv0IpxKJA"
          alt="NexaMart logo"
          width={75}
          height={75}
          priority
          className="rounded-full shadow-lg motion-safe:animate-pulse ring-2 ring-[#3c9ee0] ring-offset-2"
        />

        {/* bouncing dots */}
        <div className="flex items-center gap-2">
          <span className="w-3 h-3 rounded-full bg-[#3c9ee0] motion-safe:animate-bounce" />
          <span className="w-3 h-3 rounded-full bg-[#3c9ee0] motion-safe:animate-bounce delay-150" />
          <span className="w-3 h-3 rounded-full bg-[#3c9ee0] motion-safe:animate-bounce delay-300" />
        </div>

        <p
          className="text-xs text-gray-500 font-medium tracking-wide"
          aria-live="polite"
        >
          Preparing your shopping experience...
        </p>
      </div>

      {/* FOOTER */}
      <footer className="text-center text-[11px] text-gray-400 mb-4 sm:mb-6">
        Powered by{" "}
        <strong className="text-[#3c9ee0]">NEXLAB TECHNOLOGIES</strong>
      </footer>
    </main>
  );
}
