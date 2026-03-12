import { Bot, FileWarning, PackageSearch, ShieldCheck, Users } from "lucide-react";
import { redirect } from "next/navigation";

import {
  getAdminStats,
  getRiderStats,
  getSellerStats,
} from "@/actions/dashboardState";
import AdminPage from "@/app/marketplace/_components/AdminPage";
import {
  DashboardHero,
  PremiumActionCard,
  PremiumPanel,
} from "@/app/marketplace/_components/PremiumDashboard";
import RiderPage from "@/app/marketplace/_components/RiderPage";
import SellerPage from "@/app/marketplace/_components/SellerPage";
import { CurrentUser } from "@/lib/currentUser";

const page = async () => {
  const user = await CurrentUser();

  if (!user) {
    redirect("/auth/login");
  }

  if (user.role === "ADMIN") {
    const stats = await getAdminStats();
    return <AdminPage stats={stats} />;
  }

  if (user.role === "SELLER") {
    const stats = await getSellerStats();
    return <SellerPage stats={stats} />;
  }

  if (user.role === "RIDER") {
    const stats = await getRiderStats();
    return <RiderPage stats={stats} />;
  }

  if (user.role === "MODERATOR") {
    return (
      <main className="mx-auto max-w-7xl space-y-8 px-4 py-6">
        <DashboardHero
          eyebrow="Moderator Console"
          title="Moderator Overview"
          description="Move quickly between trust, safety, and review queues with the same premium dashboard rhythm as the rider experience."
          accentClassName="bg-[linear-gradient(135deg,#111827_0%,#1d3557_52%,#92400e_100%)]"
        />

        <PremiumPanel
          title="Moderation Workspace"
          description="Jump directly into the highest-signal queues and review surfaces."
        >
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <PremiumActionCard
              href="/marketplace/dashboard/moderator/reports"
              title="User Reports"
              description="Review active reports, triage abuse signals, and keep enforcement moving."
              icon={FileWarning}
              tintClassName="border-rose-200 bg-rose-50 text-rose-700 dark:border-rose-900/60 dark:bg-rose-950/40 dark:text-rose-300"
              cta="Open Queue"
            />
            <PremiumActionCard
              href="/marketplace/dashboard/moderator/users"
              title="Moderate Users"
              description="Inspect user status, investigate behavior, and apply moderation actions."
              icon={Users}
              tintClassName="border-sky-200 bg-sky-50 text-sky-700 dark:border-sky-900/60 dark:bg-sky-950/40 dark:text-sky-300"
              cta="Inspect"
            />
            <PremiumActionCard
              href="/marketplace/dashboard/moderator/products"
              title="Products Review"
              description="Validate listings, resolve content flags, and maintain catalog quality."
              icon={PackageSearch}
              tintClassName="border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900/60 dark:bg-emerald-950/40 dark:text-emerald-300"
              cta="Review"
            />
            <PremiumActionCard
              href="/marketplace/dashboard/moderator/ai"
              title="AI Moderation Center"
              description="Manage automation queues, confidence thresholds, and assisted review flows."
              icon={Bot}
              tintClassName="border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-900/60 dark:bg-amber-950/40 dark:text-amber-300"
              cta="Manage"
            />
          </div>
        </PremiumPanel>

        <section className="grid grid-cols-1 gap-4 lg:grid-cols-3">
          <div className="rounded-[24px] border border-slate-200/80 bg-white p-5 shadow-[0_18px_45px_-36px_rgba(15,23,42,0.45)] dark:border-zinc-800 dark:bg-zinc-950">
            <ShieldCheck className="mb-4 h-10 w-10 rounded-2xl border border-sky-200 bg-sky-50 p-2 text-sky-700 dark:border-sky-900/60 dark:bg-sky-950/40 dark:text-sky-300" />
            <h2 className="text-base font-semibold text-slate-950 dark:text-white">
              Policy Coverage
            </h2>
            <p className="mt-2 text-sm leading-6 text-slate-500 dark:text-zinc-400">
              Use the reports and product review queues to keep enforcement consistent across user and catalog activity.
            </p>
          </div>

          <div className="rounded-[24px] border border-slate-200/80 bg-white p-5 shadow-[0_18px_45px_-36px_rgba(15,23,42,0.45)] dark:border-zinc-800 dark:bg-zinc-950">
            <FileWarning className="mb-4 h-10 w-10 rounded-2xl border border-rose-200 bg-rose-50 p-2 text-rose-700 dark:border-rose-900/60 dark:bg-rose-950/40 dark:text-rose-300" />
            <h2 className="text-base font-semibold text-slate-950 dark:text-white">
              Queue Discipline
            </h2>
            <p className="mt-2 text-sm leading-6 text-slate-500 dark:text-zinc-400">
              Prioritize newly opened reports first, then work older unresolved cases to keep response times predictable.
            </p>
          </div>

          <div className="rounded-[24px] border border-slate-200/80 bg-white p-5 shadow-[0_18px_45px_-36px_rgba(15,23,42,0.45)] dark:border-zinc-800 dark:bg-zinc-950">
            <Bot className="mb-4 h-10 w-10 rounded-2xl border border-amber-200 bg-amber-50 p-2 text-amber-700 dark:border-amber-900/60 dark:bg-amber-950/40 dark:text-amber-300" />
            <h2 className="text-base font-semibold text-slate-950 dark:text-white">
              Automation Oversight
            </h2>
            <p className="mt-2 text-sm leading-6 text-slate-500 dark:text-zinc-400">
              AI moderation should accelerate review, not replace it. Keep edge cases inside the human workflow.
            </p>
          </div>
        </section>
      </main>
    );
  }

  redirect("/403");
};

export default page;
