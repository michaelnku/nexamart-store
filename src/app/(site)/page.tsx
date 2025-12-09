import HomeSkeleton from "@/components/skeletons/HomeSkeleton";
import dynamic from "next/dynamic";

const wait = (ms: number) => new Promise((res) => setTimeout(res, ms));

const HomeContent = dynamic(() => import("./HomeContent"), {
  loading: () => <HomeSkeleton />,
  ssr: true,
});

export default async function Home() {
  await wait(1800);

  return (
    <main className="max-w-7xl mx-auto px-6 py-6 space-y-12">
      <HomeContent />
    </main>
  );
}
