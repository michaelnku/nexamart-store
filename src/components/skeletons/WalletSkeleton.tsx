import { Skeleton } from "@/components/ui/skeleton";
import { WalletRole } from "@/types/wallet";

type WalletSkeletonProps = {
  role?: WalletRole;
};

export function WalletSkeleton({ role = "buyer" }: WalletSkeletonProps) {
  const isBuyer = role === "buyer";

  return (
    <main className="mx-auto min-h-full max-w-5xl space-y-8 px-4 py-6">
      <header className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="space-y-2">
          <Skeleton className="h-7 w-28" />
          <Skeleton className="h-4 w-40" />
        </div>
        <div className="flex gap-2">
          {isBuyer ? (
            <>
              <Skeleton className="h-10 w-28 rounded-md" />
              <Skeleton className="h-10 w-24 rounded-md" />
            </>
          ) : (
            <Skeleton className="h-10 w-40 rounded-md" />
          )}
        </div>
      </header>

      {isBuyer ? (
        <section className="rounded-xl border bg-background p-6 shadow-sm">
          <Skeleton className="h-6 w-44" />
          <Skeleton className="mt-4 h-10 w-64" />
          <Skeleton className="mt-3 h-4 w-72" />
          <div className="mt-3 flex gap-6">
            <Skeleton className="h-4 w-20" />
            <Skeleton className="h-4 w-20" />
          </div>
        </section>
      ) : (
        <>
          <section className="rounded-2xl border bg-background p-8 shadow-sm">
            <Skeleton className="h-6 w-44" />
            <Skeleton className="mt-4 h-10 w-64" />
          </section>

          <section className="grid gap-6 md:grid-cols-2">
            <div className="rounded-xl border bg-background p-6 shadow-sm">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="mt-3 h-8 w-40" />
            </div>
            <div className="rounded-xl border bg-background p-6 shadow-sm">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="mt-3 h-8 w-40" />
            </div>
          </section>
        </>
      )}

      <section className="rounded-xl border bg-background shadow-sm">
        <div className="flex items-center justify-between border-b p-4">
          <Skeleton className="h-6 w-44" />
          <Skeleton className="h-4 w-16" />
        </div>
        <div className="space-y-3 p-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="grid grid-cols-5 gap-3">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-full" />
            </div>
          ))}
        </div>
      </section>

      {!isBuyer && (
        <section className="rounded-xl border bg-background shadow-sm">
          <div className="flex items-center justify-between border-b p-5">
            <Skeleton className="h-6 w-44" />
            <Skeleton className="h-5 w-5 rounded-full" />
          </div>
          <div className="space-y-3 p-5">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="grid grid-cols-3 gap-3">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-full" />
              </div>
            ))}
          </div>
        </section>
      )}
    </main>
  );
}

export function CustomerWalletSkeleton() {
  return <WalletSkeleton role="buyer" />;
}
