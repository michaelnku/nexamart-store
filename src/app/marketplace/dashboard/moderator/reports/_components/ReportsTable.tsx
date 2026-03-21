import Link from "next/link";
import { Eye } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ReportStatusBadge } from "./ReportBadges";

type ReportItem = Awaited<
  ReturnType<typeof import("@/lib/moderation/getUserReports").getUserReports>
>[number];

const styles = {
  premiumSurface:
    "rounded-2xl border border-slate-200/80 bg-white shadow-[0_22px_60px_-40px_rgba(15,23,42,0.35)] dark:border-zinc-800 dark:bg-zinc-950",
  tintedSurface:
    "rounded-xl border border-slate-200/70 bg-slate-50/80 dark:border-zinc-800 dark:bg-zinc-900/70",
  token:
    "text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-400 dark:text-zinc-500",
};

function getUserDisplay(
  user?: {
    name: string | null;
    username: string | null;
    email: string;
  } | null,
) {
  if (!user) return "N/A";
  return user.name || user.username || user.email;
}

function EmptyState() {
  return (
    <div
      className={`${styles.premiumSurface} py-10 text-center text-muted-foreground`}
    >
      No user reports found.
    </div>
  );
}

function ReportCard({ report }: { report: ReportItem }) {
  return (
    <article className={`${styles.tintedSurface} p-4`}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 space-y-1">
          <p className={styles.token}>Report</p>
          <p className="font-semibold text-slate-950 dark:text-zinc-100">
            {report.id.slice(0, 10)}
          </p>
          <p className="text-xs text-slate-500 dark:text-zinc-400">
            {new Date(report.createdAt).toDateString()}
          </p>
        </div>
        <ReportStatusBadge status={report.status} />
      </div>

      <div className="mt-4 rounded-xl border border-slate-200/80 bg-white/90 p-4 dark:border-zinc-800 dark:bg-zinc-950/80">
        <p className={styles.token}>Statement</p>
        <p className="mt-1 text-sm text-slate-700 line-clamp-2 dark:text-zinc-300">
          {report.description || "No description provided."}
        </p>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-3">
        <div>
          <p className={styles.token}>Reporter</p>
          <p className="mt-1 font-medium text-slate-950 dark:text-zinc-100">
            {getUserDisplay(report.reporter)}
          </p>
          <p className="text-sm text-slate-500 dark:text-zinc-400">
            {report.reporter.role}
          </p>
        </div>

        <div>
          <p className={styles.token}>Reported</p>
          <p className="mt-1 font-medium text-slate-950 dark:text-zinc-100">
            {getUserDisplay(report.reportedUser)}
          </p>
          <p className="text-sm text-slate-500 dark:text-zinc-400">
            {report.reportedUser?.role ?? "N/A"}
          </p>
        </div>

        <div>
          <p className={styles.token}>Target</p>
          <p className="mt-1 font-medium text-slate-700 dark:text-zinc-200">
            {report.targetType}
          </p>
          <p className="text-sm text-slate-500 line-clamp-1 dark:text-zinc-400">
            {report.targetId}
          </p>
        </div>

        <div>
          <p className={styles.token}>Reason</p>
          <p className="mt-1 text-base font-bold tracking-tight text-[var(--brand-blue)]">
            {report.reason}
          </p>
        </div>
      </div>

      <div className="mt-4 flex items-center justify-between gap-3">
        <div className="text-xs text-slate-500 dark:text-zinc-400">
          {report.moderationIncident ? (
            <Link
              href={`/marketplace/dashboard/moderator/incidents/${report.moderationIncident.id}`}
              className="font-medium underline underline-offset-4"
            >
              Incident {report.moderationIncident.id.slice(0, 10)}
            </Link>
          ) : (
            "No linked incident"
          )}
        </div>

        <Button asChild variant="outline" size="sm">
          <Link href={`/marketplace/dashboard/moderator/reports/${report.id}`}>
            <Eye className="mr-2 h-4 w-4" />
            Open
          </Link>
        </Button>
      </div>
    </article>
  );
}

function ReportsDesktopTable({ reports }: { reports: ReportItem[] }) {
  return (
    <div className="hidden rounded-2xl border bg-background lg:block">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Report</TableHead>
            <TableHead>Reporter</TableHead>
            <TableHead>Reported</TableHead>
            <TableHead>Target</TableHead>
            <TableHead>Reason</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Linked Incident</TableHead>
            <TableHead>Created</TableHead>
            <TableHead className="text-right">Action</TableHead>
          </TableRow>
        </TableHeader>

        <TableBody>
          {reports.map((report) => (
            <TableRow key={report.id}>
              <TableCell>
                <div className="font-medium">{report.id.slice(0, 10)}</div>
                <div className="text-xs text-muted-foreground line-clamp-2">
                  {report.description || "No description provided."}
                </div>
              </TableCell>

              <TableCell>
                <div className="font-medium">{getUserDisplay(report.reporter)}</div>
                <div className="text-xs text-muted-foreground">
                  {report.reporter.role}
                </div>
              </TableCell>

              <TableCell>
                <div className="font-medium">
                  {getUserDisplay(report.reportedUser)}
                </div>
                <div className="text-xs text-muted-foreground">
                  {report.reportedUser?.role ?? "N/A"}
                </div>
              </TableCell>

              <TableCell>
                <div className="font-medium">{report.targetType}</div>
                <div className="text-xs text-muted-foreground">
                  {report.targetId}
                </div>
              </TableCell>

              <TableCell>{report.reason}</TableCell>
              <TableCell>
                <ReportStatusBadge status={report.status} />
              </TableCell>
              <TableCell>
                {report.moderationIncident ? (
                  <Link
                    href={`/marketplace/dashboard/moderator/incidents/${report.moderationIncident.id}`}
                    className="text-sm font-medium underline underline-offset-4"
                  >
                    {report.moderationIncident.id.slice(0, 10)}
                  </Link>
                ) : (
                  "N/A"
                )}
              </TableCell>
              <TableCell>{new Date(report.createdAt).toLocaleString()}</TableCell>
              <TableCell className="text-right">
                <Button asChild variant="outline" size="sm">
                  <Link
                    href={`/marketplace/dashboard/moderator/reports/${report.id}`}
                  >
                    <Eye className="mr-2 h-4 w-4" />
                    Open
                  </Link>
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

export function ReportsTable({ reports }: { reports: ReportItem[] }) {
  if (reports.length === 0) {
    return <EmptyState />;
  }

  return (
    <div className="space-y-4">
      <div className="grid gap-4 lg:hidden">
        {reports.map((report) => (
          <ReportCard key={report.id} report={report} />
        ))}
      </div>

      <ReportsDesktopTable reports={reports} />
    </div>
  );
}
