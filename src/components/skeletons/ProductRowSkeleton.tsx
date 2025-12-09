export default function ProductRowSkeleton({ title }: { title: string }) {
  return (
    <section className="mb-10 space-y-3 animate-pulse">
      <h2 className="h-5 w-48 bg-gray-300 rounded"></h2>
      <div className="flex gap-4 overflow-hidden">
        {Array.from({ length: 8 }).map((_, i) => (
          <div
            key={i}
            className="min-w-[200px] h-[260px] bg-gray-200 rounded-xl"
          />
        ))}
      </div>
    </section>
  );
}
