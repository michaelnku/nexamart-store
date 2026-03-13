import HomeSkeleton from "@/components/skeletons/HomeSkeleton";
import { Suspense } from "react";
import HomeContent from "./HomeContent";
import { CurrentUser } from "@/lib/currentUser";
import { redirect } from "next/navigation";
import {
  getDashboardRedirectForRole,
  isStaffRole,
} from "@/lib/auth/roleRedirect";

export default async function Home() {
  const user = await CurrentUser();

  if (isStaffRole(user?.role)) {
    const redirectTo = getDashboardRedirectForRole(user.role);
    if (redirectTo) {
      redirect(redirectTo);
    }
  }

  return (
    <main className="min-h-[calc(100vh-64px)] bg-slate-50 dark:bg-slate-900">
      <div className="mx-auto max-w-7xl space-y-10 px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
        <Suspense fallback={<HomeSkeleton />}>
          <HomeContent />
        </Suspense>
      </div>
    </main>
  );
}
