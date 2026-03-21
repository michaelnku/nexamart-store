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
import {
  ReviewStatusBadge,
  SeverityBadge,
  StatusBadge,
} from "../../incidents/_components/IncidentBadges";
import type { AiModerationQueueItem as AiQueueItem } from "@/lib/moderation/getAiModerationQueue";

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
    role: string;
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
      No AI moderation items found.
    </div>
  );
}

function AiIncidentCard({ incident }: { incident: AiQueueItem }) {
  return (
    <article className={`${styles.tintedSurface} p-4`}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 space-y-1">
          <p className={styles.token}>Incident</p>
          <p className="font-semibold text-slate-950 dark:text-zinc-100">
            {incident.id.slice(0, 10)}
          </p>
          <p className="text-xs text-slate-500 dark:text-zinc-400">
            {new Date(incident.createdAt).toDateString()}
          </p>
        </div>
        <SeverityBadge severity={incident.severity} />
      </div>

      <div className="mt-4 rounded-xl border border-slate-200/80 bg-white/90 p-4 dark:border-zinc-800 dark:bg-zinc-950/80">
        <p className={styles.token}>Reason</p>
        <p className="mt-1 text-sm text-slate-700 line-clamp-2 dark:text-zinc-300">
          {incident.reason}
        </p>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-3">
        <div>
          <p className={styles.token}>Target</p>
          <p className="mt-1 font-medium text-slate-950 dark:text-zinc-100">
            {incident.targetType}
          </p>
          <p className="text-sm text-slate-500 line-clamp-1 dark:text-zinc-400">
            {incident.targetId}
          </p>
        </div>

        <div>
          <p className={styles.token}>User</p>
          <p className="mt-1 font-medium text-slate-950 dark:text-zinc-100">
            {getUserDisplay(incident.subjectUser)}
          </p>
          <p className="text-sm text-slate-500 dark:text-zinc-400">
            {incident.subjectUser?.role ?? "N/A"}
          </p>
        </div>

        <div>
          <p className={styles.token}>Confidence</p>
          <p className="mt-1 text-base font-bold tracking-tight text-[var(--brand-blue)]">
            {incident.confidence != null
              ? `${Math.round(incident.confidence * 100)}%`
              : "N/A"}
          </p>
        </div>

        <div>
          <p className={styles.token}>AI Source</p>
          <p className="mt-1 font-medium text-slate-700 dark:text-zinc-200">
            {incident.actorModerator?.displayName ?? "AI"}
          </p>
        </div>
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        <ReviewStatusBadge reviewStatus={incident.reviewStatus} />
        <StatusBadge status={incident.status} />
      </div>

      <div className="mt-4 flex items-center justify-between gap-3">
        <Button asChild variant="outline" size="sm">
          <Link href={`/marketplace/dashboard/moderator/incidents/${incident.id}`}>
            <Eye className="mr-2 h-4 w-4" />
            Review
          </Link>
        </Button>
      </div>
    </article>
  );
}

function AiIncidentsDesktopTable({ incidents }: { incidents: AiQueueItem[] }) {
  return (
    <div className="hidden rounded-2xl border bg-background lg:block">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Incident</TableHead>
            <TableHead>Target</TableHead>
            <TableHead>User</TableHead>
            <TableHead>Severity</TableHead>
            <TableHead>Confidence</TableHead>
            <TableHead>Review</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>AI Source</TableHead>
            <TableHead>Created</TableHead>
            <TableHead className="text-right">Action</TableHead>
          </TableRow>
        </TableHeader>

        <TableBody>
          {incidents.map((incident) => (
            <TableRow key={incident.id}>
              <TableCell>
                <div className="font-medium">{incident.id.slice(0, 10)}</div>
                <div className="text-xs text-muted-foreground line-clamp-2">
                  {incident.reason}
                </div>
              </TableCell>

              <TableCell>
                <div className="font-medium">{incident.targetType}</div>
                <div className="text-xs text-muted-foreground">
                  {incident.targetId}
                </div>
              </TableCell>

              <TableCell>
                <div className="font-medium">
                  {getUserDisplay(incident.subjectUser)}
                </div>
                <div className="text-xs text-muted-foreground">
                  {incident.subjectUser?.role ?? "N/A"}
                </div>
              </TableCell>

              <TableCell>
                <SeverityBadge severity={incident.severity} />
              </TableCell>

              <TableCell>
                {incident.confidence != null
                  ? `${Math.round(incident.confidence * 100)}%`
                  : "N/A"}
              </TableCell>

              <TableCell>
                <ReviewStatusBadge reviewStatus={incident.reviewStatus} />
              </TableCell>

              <TableCell>
                <StatusBadge status={incident.status} />
              </TableCell>

              <TableCell>{incident.actorModerator?.displayName ?? "AI"}</TableCell>

              <TableCell>
                {new Date(incident.createdAt).toLocaleString()}
              </TableCell>

              <TableCell className="text-right">
                <Button asChild variant="outline" size="sm">
                  <Link
                    href={`/marketplace/dashboard/moderator/incidents/${incident.id}`}
                  >
                    <Eye className="mr-2 h-4 w-4" />
                    Review
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

export function AiReviewQueueTable({
  incidents,
}: {
  incidents: AiQueueItem[];
}) {
  if (incidents.length === 0) {
    return <EmptyState />;
  }

  return (
    <div className="space-y-4">
      <div className="grid gap-4 lg:hidden">
        {incidents.map((incident) => (
          <AiIncidentCard key={incident.id} incident={incident} />
        ))}
      </div>

      <AiIncidentsDesktopTable incidents={incidents} />
    </div>
  );
}
