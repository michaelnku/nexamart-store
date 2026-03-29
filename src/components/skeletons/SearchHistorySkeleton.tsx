import { Skeleton } from "@/components/ui/skeleton";

export default function SearchHistorySkeleton() {
  return (
    <main className="mx-auto min-h-full w-full max-w-4xl space-y-10 px-4 py-8">
      <Skeleton className="h-8 w-48 rounded-lg" />

      {Array.from({ length: 2 }).map((_, sectionIndex) => (
        <section key={sectionIndex} className="space-y-4">
          <Skeleton className="h-4 w-32 rounded-lg" />
          <div className="flex flex-wrap gap-2">
            {Array.from({ length: sectionIndex === 0 ? 6 : 8 }).map((__, chipIndex) => (
              <Skeleton
                key={chipIndex}
                className="h-9 rounded-full"
                style={{ width: `${88 + ((chipIndex + sectionIndex) % 4) * 20}px` }}
              />
            ))}
          </div>
        </section>
      ))}
    </main>
  );
}
