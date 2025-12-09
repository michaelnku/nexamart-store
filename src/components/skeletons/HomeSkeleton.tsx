export default function HomeSkeleton() {
  return (
    <div className="space-y-10 animate-fade">
      {/* Banner */}
      <div className="h-48 w-full rounded-lg bg-gray-200 animate-pulse" />

      {/* Categories */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <div
            key={i}
            className="h-20 rounded-lg bg-gray-200 animate-pulse ring-1 ring-[#3c9ee0]/5"
          />
        ))}
      </div>

      {/* Product rows */}
      {Array.from({ length: 3 }).map((_, i) => (
        <div key={i} className="grid grid-cols-2 sm:grid-cols-4 gap-6">
          {Array.from({ length: 4 }).map((_, j) => (
            <div
              key={j}
              className="h-60 rounded-xl bg-gray-200 animate-pulse ring-1 ring-[#3c9ee0]/5"
            />
          ))}
        </div>
      ))}
    </div>
  );
}
