import HomeSkeleton from "@/components/skeletons/HomeSkeleton";
import { Suspense } from "react";
import HomeContent from "./HomeContent";
import { CurrentUser } from "@/lib/currentUser";
import { redirect } from "next/navigation";
import {
  ADMIN_LOGIN_REDIRECT,
  MODERATOR_LOGIN_REDIRECT,
  RIDER_LOGIN_REDIRECT,
  SELLER_LOGIN_REDIRECT,
} from "@/routes";

const STAFF_DASHBOARD: Record<string, string> = {
  ADMIN: ADMIN_LOGIN_REDIRECT,
  SELLER: SELLER_LOGIN_REDIRECT,
  RIDER: RIDER_LOGIN_REDIRECT,
  MODERATOR: MODERATOR_LOGIN_REDIRECT,
};

export default async function Home() {
  const user = await CurrentUser();

  if (user?.role && STAFF_DASHBOARD[user.role]) {
    redirect(STAFF_DASHBOARD[user.role]);
  }

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
