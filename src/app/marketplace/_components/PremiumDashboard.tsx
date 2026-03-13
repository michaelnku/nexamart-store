import Link from "next/link";
import type { LucideIcon } from "lucide-react";

import { cn } from "@/lib/utils";

type DashboardHeroProps = {
  eyebrow?: string;
  title: string;
  description: string;
  accentClassName?: string;
};

function DashboardHero({
  eyebrow,
  title,
  description,
  accentClassName,
}: DashboardHeroProps) {
  return (
    <section
      className={cn(
        "relative overflow-hidden rounded-[24px] border border-slate-200/70 bg-[linear-gradient(135deg,#0f172a_0%,#12335a_52%,#0f766e_100%)] px-4 py-5 text-white shadow-[0_28px_90px_-36px_rgba(15,23,42,0.7)] sm:rounded-[28px] sm:px-6 sm:py-7 lg:px-8 lg:py-8",
        accentClassName,
      )}
    >
      <div className="absolute inset-y-0 right-0 hidden w-1/3 bg-[radial-gradient(circle_at_center,_rgba(255,255,255,0.18),_transparent_65%)] lg:block" />
      <div className="absolute -left-10 top-0 h-28 w-28 rounded-full bg-white/10 blur-3xl sm:-left-16 sm:h-40 sm:w-40" />
      <div className="relative max-w-3xl space-y-3">
        {eyebrow ? (
          <span className="inline-flex rounded-full border border-white/20 bg-white/10 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-100/90 backdrop-blur sm:px-3 sm:text-xs sm:tracking-[0.24em]">
            {eyebrow}
          </span>
        ) : null}
        <div className="space-y-2">
          <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl lg:text-4xl">
            {title}
          </h1>
          <p className="max-w-2xl text-sm leading-6 text-slate-100/80 sm:text-base">
            {description}
          </p>
        </div>
      </div>
    </section>
  );
}

type PremiumStatCardProps = {
  title: string;
  value: string | number;
  description?: string;
  icon: LucideIcon;
  tintClassName: string;
  href?: string;
};

function PremiumStatCard({
  title,
  value,
  description,
  icon: Icon,
  tintClassName,
  href,
}: PremiumStatCardProps) {
  const content = (
    <div
      className={cn(
        "group relative flex h-full min-h-[148px] flex-col overflow-hidden rounded-[22px] border border-slate-200/80 bg-white p-4 shadow-[0_18px_45px_-30px_rgba(15,23,42,0.45)] transition duration-200 hover:-translate-y-1 hover:shadow-[0_30px_70px_-38px_rgba(15,23,42,0.5)] dark:border-zinc-800 dark:bg-zinc-950 sm:min-h-[164px] sm:rounded-[24px] sm:p-5",
        href ? "cursor-pointer" : "",
      )}
    >
      <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-white/0 via-white/70 to-white/0 opacity-70" />
      <div className="flex flex-1 flex-col gap-4 sm:flex-row sm:items-start sm:justify-between sm:gap-5">
        <div className="min-w-0 flex-1 space-y-2">
          <p className="text-xs font-medium uppercase tracking-[0.16em] text-slate-500 dark:text-zinc-400 sm:text-sm sm:normal-case sm:tracking-normal">
            {title}
          </p>
          <p className="break-words text-lg font-semibold leading-tight tracking-tight text-slate-950 dark:text-white sm:text-2xl lg:text-[1.75rem]">
            {value}
          </p>
          {description ? (
            <p className="max-w-[34ch] text-xs leading-5 text-slate-500 dark:text-zinc-500 sm:text-sm">
              {description}
            </p>
          ) : null}
        </div>

        <div
          className={cn(
            "flex h-10 w-10 shrink-0 items-center justify-center self-start rounded-xl border shadow-sm sm:h-12 sm:w-12 sm:rounded-2xl",
            tintClassName,
          )}
        >
          <Icon className="h-5 w-5" />
        </div>
      </div>
    </div>
  );

  if (!href) {
    return content;
  }

  return (
    <Link href={href} className="block">
      {content}
    </Link>
  );
}

type PremiumNoticeProps = {
  icon: LucideIcon;
  title: string;
  description: string;
  toneClassName: string;
};

function PremiumNotice({
  icon: Icon,
  title,
  description,
  toneClassName,
}: PremiumNoticeProps) {
  return (
    <div
      className={cn(
        "flex gap-4 rounded-[20px] border px-4 py-4 shadow-[0_14px_40px_-32px_rgba(15,23,42,0.5)] sm:rounded-2xl",
        toneClassName,
      )}
    >
      <div className="mt-0.5">
        <Icon className="h-4 w-4 shrink-0" />
      </div>
      <div className="space-y-1">
        <p className="text-sm font-semibold">{title}</p>
        <p className="text-sm leading-6">{description}</p>
      </div>
    </div>
  );
}

type PremiumPanelProps = {
  title: string;
  description?: string;
  children: React.ReactNode;
};

function PremiumPanel({ title, description, children }: PremiumPanelProps) {
  return (
    <section className="rounded-[24px] border border-slate-200/80 bg-white p-4 shadow-[0_24px_70px_-42px_rgba(15,23,42,0.45)] dark:border-zinc-800 dark:bg-zinc-950 sm:rounded-[28px] sm:p-6">
      <div className="mb-5 space-y-1">
        <h2 className="text-lg font-semibold text-slate-950 dark:text-white">
          {title}
        </h2>
        {description ? (
          <p className="text-sm text-slate-500 dark:text-zinc-400">
            {description}
          </p>
        ) : null}
      </div>
      {children}
    </section>
  );
}

type PremiumActionCardProps = {
  href: string;
  title: string;
  description: string;
  icon: LucideIcon;
  tintClassName: string;
  cta: string;
};

function PremiumActionCard({
  href,
  title,
  description,
  icon: Icon,
  tintClassName,
  cta,
}: PremiumActionCardProps) {
  return (
    <Link
      href={href}
      className="group block rounded-[22px] border border-slate-200/80 bg-white p-4 shadow-[0_18px_50px_-36px_rgba(15,23,42,0.45)] transition duration-200 hover:-translate-y-1 hover:shadow-[0_28px_80px_-42px_rgba(15,23,42,0.5)] dark:border-zinc-800 dark:bg-zinc-950 sm:rounded-[24px] sm:p-5"
    >
      <div className="flex items-start justify-between gap-3 sm:gap-4">
        <div
          className={cn(
            "flex h-10 w-10 items-center justify-center rounded-xl border shadow-sm sm:h-12 sm:w-12 sm:rounded-2xl",
            tintClassName,
          )}
        >
          <Icon className="h-5 w-5" />
        </div>
        <span className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400 transition group-hover:text-slate-600 dark:group-hover:text-zinc-300">
          {cta}
        </span>
      </div>

      <div className="mt-4 space-y-2 sm:mt-5">
        <h3 className="text-base font-semibold text-slate-950 dark:text-white">
          {title}
        </h3>
        <p className="text-sm leading-6 text-slate-500 dark:text-zinc-400">
          {description}
        </p>
      </div>
    </Link>
  );
}

export {
  DashboardHero,
  PremiumActionCard,
  PremiumNotice,
  PremiumPanel,
  PremiumStatCard,
};
