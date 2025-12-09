import Link from "next/link";

export default function Hero() {
  return (
    <main className="">
      <section className="max-w-7xl mx-auto hidden flex-col md:flex-row items-center justify-between px-4 gap-8 md:px-16 ">
        {/* Left Side: Text */}
        <div className="gap-6 flex flex-1 flex-col">
          <section className="max-w-lg  space-y-6 text-center md:text-left">
            <h2 className="text-4xl md:text-6xl font-extrabold text-zinc-900 dark:text-white mb-4 leading-tight ">
              Welcome to Mini-Mart
            </h2>
            <p className="text-lg md:text-xl text-zinc-600 dark:text-zinc-300 max-w-3xl">
              Shop premium quality products across Electronics, Fashion,
              Groceries, and more. We make it simple to find exactly what you
              need with curated selections and fast delivery.
            </p>
          </section>

          <div className="flex flex-wrap gap-6 justify-center md:justify-start">
            <Link
              href="/shop"
              className="px-8 py-3 bg-blue-600 text-white font-semibold rounded-full shadow-lg hover:bg-blue-700 transition-transform transform hover:scale-105"
            >
              Shop Now
            </Link>
            <Link
              href="/about"
              className="px-8 py-3 border border-blue-600 text-blue-600 dark:border-blue-400 dark:text-blue-400 font-semibold rounded-full hover:bg-blue-50 dark:hover:bg-blue-900/30 transition-transform transform hover:scale-105"
            >
              Learn More
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
