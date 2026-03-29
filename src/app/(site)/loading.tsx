import HomeSkeleton from "@/components/skeletons/HomeSkeleton";
import SitePageShell from "./_components/SitePageShell";

export default function Loading() {
  return (
    <SitePageShell className="max-w-7xl px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
      <HomeSkeleton />
    </SitePageShell>
  );
}
