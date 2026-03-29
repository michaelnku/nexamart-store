import SitePageShell from "@/app/(site)/_components/SitePageShell";
import { Skeleton } from "@/components/ui/skeleton";

function AuthPageLoading() {
  return (
    <SitePageShell className="max-w-5xl items-center justify-center px-4 py-10 sm:px-6 lg:px-8">
      <div className="w-full max-w-md space-y-6 rounded-2xl border p-8 shadow-lg">
        <div className="space-y-2 text-center">
          <Skeleton className="mx-auto h-10 w-10 rounded-full" />
          <Skeleton className="mx-auto h-7 w-40" />
          <Skeleton className="mx-auto h-4 w-56" />
        </div>
        <div className="space-y-4">
          <Skeleton className="h-11 w-full rounded-lg" />
          <Skeleton className="h-11 w-full rounded-lg" />
          <Skeleton className="h-11 w-full rounded-lg" />
        </div>
        <Skeleton className="h-11 w-full rounded-lg" />
      </div>
    </SitePageShell>
  );
}

function SitePageLoading() {
  return (
    <SitePageShell className="max-w-7xl space-y-6 px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
      <div className="space-y-2">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-4 w-80" />
      </div>
      <div className="space-y-4">
        <Skeleton className="h-40 w-full rounded-2xl" />
        <Skeleton className="h-28 w-full rounded-2xl" />
        <Skeleton className="h-28 w-full rounded-2xl" />
      </div>
    </SitePageShell>
  );
}

function SiteGridLoading() {
  return (
    <SitePageShell className="max-w-7xl space-y-6 px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
      <div className="space-y-2">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-4 w-72" />
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {Array.from({ length: 8 }).map((_, index) => (
          <div key={index} className="space-y-3 rounded-xl border p-4">
            <Skeleton className="h-40 w-full rounded-xl" />
            <Skeleton className="h-5 w-3/4" />
            <Skeleton className="h-4 w-1/2" />
          </div>
        ))}
      </div>
    </SitePageShell>
  );
}

function SiteTableLoading() {
  return (
    <SitePageShell className="max-w-7xl space-y-6 px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
      <div className="space-y-2">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-4 w-72" />
      </div>
      <div className="rounded-xl border p-4">
        <div className="space-y-4">
          <Skeleton className="h-10 w-full rounded-md" />
          {Array.from({ length: 6 }).map((_, index) => (
            <div key={index} className="grid gap-3 border-t pt-4 sm:grid-cols-4 lg:grid-cols-6">
              <Skeleton className="h-5 w-full" />
              <Skeleton className="h-5 w-full" />
              <Skeleton className="h-5 w-24" />
              <Skeleton className="h-5 w-24" />
              <Skeleton className="h-5 w-24" />
              <Skeleton className="h-9 w-20 rounded-md" />
            </div>
          ))}
        </div>
      </div>
    </SitePageShell>
  );
}

function SiteDetailLoading() {
  return (
    <SitePageShell className="max-w-6xl space-y-6 px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
      <div className="space-y-2">
        <Skeleton className="h-8 w-56" />
        <Skeleton className="h-4 w-72" />
      </div>
      <Skeleton className="h-16 w-full rounded-xl" />
      <div className="grid gap-6 lg:grid-cols-[1.3fr_0.7fr]">
        <div className="space-y-4 rounded-xl border p-5">
          <Skeleton className="h-64 w-full rounded-xl" />
          <Skeleton className="h-5 w-2/3" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-5/6" />
        </div>
        <div className="space-y-4 rounded-xl border p-5">
          <Skeleton className="h-6 w-32" />
          <Skeleton className="h-10 w-full rounded-md" />
          <Skeleton className="h-10 w-full rounded-md" />
          <Skeleton className="h-10 w-full rounded-md" />
        </div>
      </div>
    </SitePageShell>
  );
}

function CenteredPageLoading() {
  return (
    <SitePageShell className="max-w-5xl items-center justify-center px-4 py-10">
      <div className="w-full max-w-2xl space-y-4 rounded-2xl border p-8 text-center">
        <Skeleton className="mx-auto h-8 w-52" />
        <Skeleton className="mx-auto h-4 w-72" />
        <Skeleton className="mx-auto h-4 w-64" />
        <Skeleton className="mx-auto h-11 w-40 rounded-lg" />
      </div>
    </SitePageShell>
  );
}

function SettingsPageLoading() {
  return (
    <SitePageShell className="max-w-6xl space-y-6 px-4 py-6 sm:px-6 sm:py-8">
      <div className="space-y-2">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-4 w-72" />
      </div>
      <div className="space-y-4 rounded-xl border p-6">
        <Skeleton className="h-6 w-40" />
        <div className="grid gap-4 sm:grid-cols-2">
          <Skeleton className="h-11 w-full rounded-md" />
          <Skeleton className="h-11 w-full rounded-md" />
          <Skeleton className="h-11 w-full rounded-md sm:col-span-2" />
        </div>
      </div>
    </SitePageShell>
  );
}

function DashboardPageLoading() {
  return (
    <SitePageShell className="space-y-6">
      <div className="space-y-2">
        <Skeleton className="h-8 w-44" />
        <Skeleton className="h-4 w-72" />
      </div>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <div key={index} className="rounded-xl border p-5">
            <Skeleton className="h-4 w-20" />
            <Skeleton className="mt-3 h-8 w-24" />
          </div>
        ))}
      </div>
      <div className="rounded-xl border p-5">
        <div className="space-y-4">
          <Skeleton className="h-6 w-40" />
          {Array.from({ length: 5 }).map((_, index) => (
            <div key={index} className="grid gap-3 border-t pt-4 sm:grid-cols-4 lg:grid-cols-5">
              <Skeleton className="h-5 w-full" />
              <Skeleton className="h-5 w-full" />
              <Skeleton className="h-5 w-24" />
              <Skeleton className="h-5 w-24" />
              <Skeleton className="h-9 w-20 rounded-md" />
            </div>
          ))}
        </div>
      </div>
    </SitePageShell>
  );
}

function ModeratorQueuePageLoading() {
  return (
    <SitePageShell className="space-y-6 text-slate-950 dark:text-zinc-100">
      <div className="space-y-2">
        <Skeleton className="h-6 w-32 rounded-full" />
        <div className="space-y-2">
          <Skeleton className="h-8 w-56" />
          <Skeleton className="h-4 w-80 max-w-full" />
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {Array.from({ length: 3 }).map((_, index) => (
          <div
            key={index}
            className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-[0_22px_60px_-40px_rgba(15,23,42,0.35)] dark:border-zinc-800 dark:bg-zinc-950"
          >
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0 space-y-3">
                <Skeleton className="h-3 w-24" />
                <Skeleton className="h-8 w-20" />
              </div>
              <Skeleton className="h-11 w-11 rounded-2xl" />
            </div>
          </div>
        ))}
      </div>

      <div className="rounded-2xl border bg-background p-4">
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-12">
          <Skeleton className="h-10 sm:col-span-2 xl:col-span-4" />
          <Skeleton className="h-10 xl:col-span-2" />
          <Skeleton className="h-10 xl:col-span-2" />
          <Skeleton className="h-10 xl:col-span-2" />
          <Skeleton className="hidden h-10 xl:block xl:col-span-2" />
        </div>
        <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
          <Skeleton className="h-4 w-64" />
          <Skeleton className="h-9 w-28" />
        </div>
      </div>

      <div className="space-y-4">
        <div className="grid gap-4 lg:hidden">
          {Array.from({ length: 3 }).map((_, index) => (
            <div
              key={index}
              className="rounded-xl border border-slate-200/70 bg-slate-50/80 p-4 dark:border-zinc-800 dark:bg-zinc-900/70"
            >
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div className="min-w-0 space-y-2">
                  <Skeleton className="h-3 w-16" />
                  <Skeleton className="h-5 w-36" />
                  <Skeleton className="h-4 w-28" />
                </div>
                <Skeleton className="h-6 w-24 rounded-full" />
              </div>
              <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
                <Skeleton className="h-14 w-full rounded-xl" />
                <Skeleton className="h-14 w-full rounded-xl" />
                <Skeleton className="h-14 w-full rounded-xl" />
                <Skeleton className="h-14 w-full rounded-xl" />
              </div>
              <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-9 w-full rounded-md sm:w-24" />
              </div>
            </div>
          ))}
        </div>

        <div className="hidden rounded-2xl border bg-background p-4 lg:block">
          <div className="space-y-4">
            <Skeleton className="h-10 w-full rounded-md" />
            {Array.from({ length: 5 }).map((_, index) => (
              <div
                key={index}
                className="grid gap-3 border-t pt-4 sm:grid-cols-4 lg:grid-cols-6 xl:grid-cols-10"
              >
                {Array.from({ length: 9 }).map((__, cellIndex) => (
                  <Skeleton key={cellIndex} className="h-5 w-full" />
                ))}
                <Skeleton className="h-9 w-20 rounded-md" />
              </div>
            ))}
          </div>
        </div>

        <div className="flex flex-col gap-4 rounded-2xl border border-slate-200/80 bg-white p-4 shadow-[0_22px_60px_-40px_rgba(15,23,42,0.2)] dark:border-zinc-800 dark:bg-zinc-950 md:flex-row md:items-center md:justify-between">
          <Skeleton className="h-4 w-64" />
          <div className="flex gap-2">
            <Skeleton className="h-9 w-20 rounded-md" />
            <Skeleton className="h-9 w-32 rounded-md" />
            <Skeleton className="h-9 w-20 rounded-md" />
          </div>
        </div>
      </div>
    </SitePageShell>
  );
}

function FormPageLoading() {
  return (
    <SitePageShell className="max-w-4xl space-y-6 px-4 py-6 sm:px-6 sm:py-8">
      <div className="space-y-2">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-4 w-72" />
      </div>
      <div className="space-y-4 rounded-2xl border p-6">
        <Skeleton className="h-11 w-full rounded-md" />
        <Skeleton className="h-11 w-full rounded-md" />
        <Skeleton className="h-32 w-full rounded-xl" />
        <div className="grid gap-4 sm:grid-cols-2">
          <Skeleton className="h-11 w-full rounded-md" />
          <Skeleton className="h-11 w-full rounded-md" />
        </div>
        <Skeleton className="h-11 w-40 rounded-lg" />
      </div>
    </SitePageShell>
  );
}

export {
  AuthPageLoading,
  CenteredPageLoading,
  DashboardPageLoading,
  FormPageLoading,
  ModeratorQueuePageLoading,
  SettingsPageLoading,
  SiteDetailLoading,
  SiteGridLoading,
  SitePageLoading,
  SiteTableLoading,
};
