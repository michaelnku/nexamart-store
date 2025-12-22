//my app/page
import HomeSkeleton from "@/components/skeletons/HomeSkeleton";
import { Suspense } from "react";
import HomeContent from "./HomeContent";

export default function Home() {
  return (
    <main
      className="min-h-[calc(100vh-64px)] bg-slate-50 dark:bg-slate-900
"
    >
      <div className="max-w-7xl mx-auto px-6 py-6 space-y-12">
        <Suspense fallback={<HomeSkeleton />}>
          <HomeContent />
        </Suspense>
      </div>
    </main>
  );
}
