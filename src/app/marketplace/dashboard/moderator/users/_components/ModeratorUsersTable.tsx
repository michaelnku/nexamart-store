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
import { formatModerationDateTime } from "@/lib/moderation/formatters";
import { BlockStatusBadge, ModerationStateBadge } from "./ModeratorUserBadges";

type ModerationUserItem = Awaited<
  ReturnType<
    typeof import("@/lib/moderation/getModerationUsers").getModerationUsers
  >
>["items"][number];

const styles = {
  premiumSurface:
    "rounded-2xl border border-slate-200/80 bg-white shadow-[0_22px_60px_-40px_rgba(15,23,42,0.35)] dark:border-zinc-800 dark:bg-zinc-950",
  tintedSurface:
    "rounded-xl border border-slate-200/70 bg-slate-50/80 dark:border-zinc-800 dark:bg-zinc-900/70",
  token:
    "text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-400 dark:text-zinc-500",
};

function getDisplayName(user: ModerationUserItem) {
  return user.name || user.username || user.email;
}

function EmptyState() {
  return (
    <div
      className={`${styles.premiumSurface} py-10 text-center text-muted-foreground`}
    >
      No moderation users matched your filters.
    </div>
  );
}

function UserCard({ user }: { user: ModerationUserItem }) {
  return (
    <article className={`${styles.tintedSurface} p-4`}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 space-y-1">
          <p className={styles.token}>User</p>
          <p className="font-semibold text-slate-950 dark:text-zinc-100">
            {getDisplayName(user)}
          </p>
          <p className="text-xs text-slate-500 dark:text-zinc-400">{user.email}</p>
        </div>
        <BlockStatusBadge softBlockedUntil={user.softBlockedUntil} />
      </div>

      <div className="mt-4 grid grid-cols-2 gap-3">
        <div>
          <p className={styles.token}>Role</p>
          <p className="mt-1 font-medium text-slate-700 dark:text-zinc-200">
            {user.role}
          </p>
        </div>

        <div>
          <p className={styles.token}>State</p>
          <div className="mt-1">
            <ModerationStateBadge state={user.moderationState} />
          </div>
        </div>

        <div>
          <p className={styles.token}>Strikes</p>
          <p className="mt-1 text-base font-bold tracking-tight text-[var(--brand-blue)]">
            {user.moderationStrikeCount}
          </p>
        </div>

        <div>
          <p className={styles.token}>Risk</p>
          <p className="mt-1 text-base font-bold tracking-tight text-amber-600">
            {user.moderationRiskScore}
          </p>
        </div>

        <div>
          <p className={styles.token}>Incidents</p>
          <p className="mt-1 font-medium text-slate-700 dark:text-zinc-200">
            {user._count.moderationIncidents}
          </p>
        </div>

        <div>
          <p className={styles.token}>Reports</p>
          <p className="mt-1 font-medium text-slate-700 dark:text-zinc-200">
            {user._count.reportsAgainst}
          </p>
        </div>
      </div>

      <div className="mt-4 flex items-center justify-between gap-3">
        <div className="text-xs text-slate-500 dark:text-zinc-400">
          {user.moderationLastIncidentAt
            ? `Last incident: ${formatModerationDateTime(user.moderationLastIncidentAt)}`
            : "No recorded incident"}
        </div>

        <Button asChild variant="outline" size="sm">
          <Link href={`/marketplace/dashboard/moderator/users/${user.id}`}>
            <Eye className="mr-2 h-4 w-4" />
            Open
          </Link>
        </Button>
      </div>
    </article>
  );
}

function ModeratorUsersDesktopTable({
  users,
}: {
  users: ModerationUserItem[];
}) {
  return (
    <div className="hidden rounded-2xl border bg-background lg:block">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>User</TableHead>
            <TableHead>Role</TableHead>
            <TableHead>State</TableHead>
            <TableHead>Block</TableHead>
            <TableHead>Strikes</TableHead>
            <TableHead>Risk</TableHead>
            <TableHead>Incidents</TableHead>
            <TableHead>Reports</TableHead>
            <TableHead>Last Incident</TableHead>
            <TableHead className="text-right">Action</TableHead>
          </TableRow>
        </TableHeader>

        <TableBody>
          {users.map((user) => (
            <TableRow key={user.id}>
              <TableCell>
                <div className="font-medium">{getDisplayName(user)}</div>
                <div className="text-xs text-muted-foreground">{user.email}</div>
              </TableCell>

              <TableCell>{user.role}</TableCell>

              <TableCell>
                <ModerationStateBadge state={user.moderationState} />
              </TableCell>

              <TableCell>
                <BlockStatusBadge softBlockedUntil={user.softBlockedUntil} />
              </TableCell>

              <TableCell>{user.moderationStrikeCount}</TableCell>
              <TableCell>{user.moderationRiskScore}</TableCell>
              <TableCell>{user._count.moderationIncidents}</TableCell>
              <TableCell>{user._count.reportsAgainst}</TableCell>
              <TableCell>
                {user.moderationLastIncidentAt
                  ? formatModerationDateTime(user.moderationLastIncidentAt)
                  : "N/A"}
              </TableCell>

              <TableCell className="text-right">
                <Button asChild variant="outline" size="sm">
                  <Link href={`/marketplace/dashboard/moderator/users/${user.id}`}>
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

export function ModeratorUsersTable({
  users,
}: {
  users: ModerationUserItem[];
}) {
  if (users.length === 0) {
    return <EmptyState />;
  }

  return (
    <div className="space-y-4">
      <div className="grid gap-4 lg:hidden">
        {users.map((user) => (
          <UserCard key={user.id} user={user} />
        ))}
      </div>

      <ModeratorUsersDesktopTable users={users} />
    </div>
  );
}
