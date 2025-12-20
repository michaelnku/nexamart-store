import HomeSkeleton from "@/components/skeletons/HomeSkeleton";
import { Suspense } from "react";
import HomeContent from "./HomeContent";

export default function Home() {
  return (
    <main className="max-w-7xl mx-auto px-6 py-6 space-y-12 min-h-[calc(100vh-64px)]">
      <Suspense fallback={<HomeSkeleton />}>
        <HomeContent />
      </Suspense>
    </main>
  );
}
