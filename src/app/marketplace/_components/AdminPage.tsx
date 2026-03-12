"use client";

import {
  AlertTriangle,
  DollarSign,
  Package,
  Users,
} from "lucide-react";

import {
  DashboardHero,
  PremiumNotice,
  PremiumStatCard,
} from "./PremiumDashboard";

type AdminStats = {
  totalUsers: number;
  totalProducts: number;
  totalRevenue: number;
  pendingReports: number;
};

const AdminPage = ({ stats }: { stats: AdminStats }) => {
  const cards = [
    {
      title: "Total Users",
      value: stats.totalUsers,
      icon: Users,
      description: "Accounts currently active across the marketplace.",
      tintClassName:
        "border-sky-200 bg-sky-50 text-sky-700 dark:border-sky-900/60 dark:bg-sky-950/40 dark:text-sky-300",
    },
    {
      title: "Total Products",
      value: stats.totalProducts,
      icon: Package,
      description: "Listings contributing to active marketplace inventory.",
      tintClassName:
        "border-violet-200 bg-violet-50 text-violet-700 dark:border-violet-900/60 dark:bg-violet-950/40 dark:text-violet-300",
    },
    {
      title: "Total Revenue",
      value: `$${stats.totalRevenue.toFixed(2)}`,
      icon: DollarSign,
      description: "Top-line marketplace revenue recorded so far.",
      tintClassName:
        "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900/60 dark:bg-emerald-950/40 dark:text-emerald-300",
    },
    {
      title: "Pending Reports",
      value: stats.pendingReports,
      icon: AlertTriangle,
      description: "Items needing review or administrative follow-up.",
      tintClassName:
        "border-rose-200 bg-rose-50 text-rose-700 dark:border-rose-900/60 dark:bg-rose-950/40 dark:text-rose-300",
    },
  ];

  return (
    <main className="mx-auto max-w-7xl space-y-8 px-4 py-6">
      <DashboardHero
        eyebrow="Admin Dashboard"
        title="Admin Panel"
        description="Monitor platform performance, marketplace health, and operational signals from a single control surface."
        accentClassName="bg-[linear-gradient(135deg,#0f172a_0%,#334155_48%,#0f766e_100%)]"
      />

      {stats.pendingReports > 0 && (
        <PremiumNotice
          icon={AlertTriangle}
          title="Open Admin Attention"
          description={`${stats.pendingReports} report${stats.pendingReports === 1 ? "" : "s"} currently require administrative review or follow-up.`}
          toneClassName="border-rose-200 bg-rose-50 text-rose-900 dark:border-rose-900/60 dark:bg-rose-950/30 dark:text-rose-100"
        />
      )}

      <section className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {cards.map((stat) => (
          <PremiumStatCard
            key={stat.title}
            title={stat.title}
            value={stat.value}
            description={stat.description}
            icon={stat.icon}
            tintClassName={stat.tintClassName}
          />
        ))}
      </section>
    </main>
  );
};

export default AdminPage;
