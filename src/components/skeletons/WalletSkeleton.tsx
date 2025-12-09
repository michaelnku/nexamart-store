"use client";

export function WalletSkeleton() {
  return (
    <main
      className="max-w-4xl mx-auto py-10 px-4 space-y-10 animate-[pulse_1.2s_ease-in-out_infinite]
"
    >
      {/* HEADER */}
      <div>
        <div className="h-6 w-40 bg-gray-200 rounded-md"></div>
        <div className="h-4 w-24 bg-gray-200 rounded-md mt-2"></div>
      </div>

      {/* BALANCE SUMMARY CARDS */}
      <section className="grid md:grid-cols-3 gap-6">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="border rounded-xl shadow-sm p-5 bg-white space-y-4"
          >
            <div className="h-3 w-16 bg-gray-200 rounded-md"></div>
            <div className="h-6 w-16 bg-gray-300 rounded-md"></div>
            <div className="h-3 w-16 bg-gray-200 rounded-md"></div>
          </div>
        ))}
      </section>

      {/* PROGRESS BAR */}
      <section className="bg-white border rounded-xl shadow-sm p-6 space-y-4">
        <div className="h-3 w-32 bg-gray-200 rounded-md"></div>
        <div className="w-full h-3 bg-gray-200 rounded-full"></div>
        <div className="h-3 w-24 bg-gray-200 rounded-md"></div>
      </section>

      {/* TRANSACTION TABLE */}
      <section className="bg-white border rounded-xl shadow-sm p-4 space-y-3">
        <div className="h-5 w-40 bg-gray-200 rounded-md"></div>
        <div className="border rounded-md overflow-hidden">
          {[1, 2, 3].map((row) => (
            <div key={row} className="flex gap-4 p-4 border-b">
              <div className="h-4 w-32 bg-gray-200 rounded-md"></div>
              <div className="h-4 w-20 bg-gray-200 rounded-md"></div>
              <div className="h-4 w-16 bg-gray-200 rounded-md"></div>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}

export function CustomerWalletSkeleton() {
  return (
    <div
      className="max-w-4xl mx-auto px-4 py-4 space-y-8 animate-[pulse_1.2s_ease-in-out_infinite]
"
    >
      {/* HEADER */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="space-y-2">
          <div className="h-6 w-40 bg-gray-200 rounded"></div>
          <div className="h-4 w-28 bg-gray-200 rounded"></div>
        </div>

        <div className="flex gap-2">
          <div className="h-11 w-32 bg-gray-200 rounded"></div>
          <div className="h-11 w-32 bg-gray-200 rounded"></div>
        </div>
      </div>

      {/* BALANCE */}
      <div className="bg-white border shadow-sm rounded-xl p-6 space-y-5">
        <div className="h-3 w-32 bg-gray-200 rounded"></div>
        <div className="h-8 w-48 bg-gray-200 rounded"></div>
        <div className="h-3 w-60 bg-gray-200 rounded"></div>
        <div className="h-6 w-40 bg-gray-200 rounded"></div>
      </div>

      {/* TRANSACTION HISTORY */}
      <div className="bg-white border shadow-sm rounded-xl">
        <div className="px-4 py-3 border-b flex items-center justify-between">
          <div className="h-4 w-32 bg-gray-200 rounded"></div>
          <div className="h-3 w-24 bg-gray-200 rounded"></div>
        </div>

        <div className="space-y-3 py-6 px-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="flex justify-between items-center">
              <div className="h-4 w-24 bg-gray-200 rounded"></div>
              <div className="h-4 w-40 bg-gray-200 rounded"></div>
              <div className="h-4 w-20 bg-gray-200 rounded"></div>
              <div className="h-4 w-24 bg-gray-200 rounded"></div>
              <div className="h-5 w-16 bg-gray-200 rounded-full"></div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
