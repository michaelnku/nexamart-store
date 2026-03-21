import Link from "next/link";
import { notFound } from "next/navigation";

import { Button } from "@/components/ui/button";
import { requireModerator } from "@/lib/moderation/guardModerator";
import {
  getModerationUserById,
  getReportsAgainstUser,
  getUserIncidentHistory,
} from "@/lib/moderation/getModerationUsers";
import {
  BlockStatusBadge,
  ModerationStateBadge,
} from "../_components/ModeratorUserBadges";
import { ModerationUserActionButtons } from "./_components/ModerationUserActionButtons";

const styles = {
  premiumSurface:
    "overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-[0_22px_60px_-40px_rgba(15,23,42,0.35)] dark:border-zinc-800 dark:bg-zinc-950",
  sectionHeader:
    "border-b border-slate-200/80 bg-[linear-gradient(180deg,rgba(60,158,224,0.08),rgba(255,255,255,0.96))] px-6 py-4 dark:border-zinc-800 dark:bg-[linear-gradient(180deg,rgba(60,158,224,0.12),rgba(24,24,27,0.96))]",
  title:
    "text-base font-semibold text-slate-950 dark:text-zinc-100",
  description:
    "text-sm text-slate-500 dark:text-zinc-400",
};

function PremiumSection({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <section className={styles.premiumSurface}>
      <div className={styles.sectionHeader}>
        <div>
          <h2 className={styles.title}>{title}</h2>
          {description ? <p className={styles.description}>{description}</p> : null}
        </div>
      </div>
      <div className="p-6">{children}</div>
    </section>
  );
}

export default async function ModeratorUserDetailsPage(props: {
  params: Promise<{ userId: string }>;
}) {
  await requireModerator();
  const { userId } = await props.params;

  const user = await getModerationUserById(userId);

  if (!user) {
    notFound();
  }

  const [incidentHistory, reportsAgainst] = await Promise.all([
    getUserIncidentHistory(userId),
    getReportsAgainstUser(userId),
  ]);

  const displayName = user.name || user.username || user.email;

  return (
    <div className="space-y-6 text-slate-950 dark:text-zinc-100">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            Moderation User Details
          </h1>
          <p className="text-sm text-slate-500 dark:text-zinc-400">
            Review moderation profile, restrictions, incidents, and reports for
            this user.
          </p>
        </div>

        <Button asChild variant="outline">
          <Link href="/marketplace/dashboard/moderator/users">
            Back to Users
          </Link>
        </Button>
      </div>

      <div className="grid gap-6 xl:grid-cols-3">
        <div className="space-y-6 xl:col-span-2">
          <PremiumSection
            title="User Summary"
            description="Core moderation profile, role, counts, and restriction state."
          >
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <div className="text-sm text-muted-foreground">User</div>
                <div className="font-medium">{displayName}</div>
              </div>

              <div>
                <div className="text-sm text-muted-foreground">Role</div>
                <div className="font-medium">{user.role}</div>
              </div>

              <div>
                <div className="text-sm text-muted-foreground">Email</div>
                <div className="font-medium">{user.email}</div>
              </div>

              <div>
                <div className="text-sm text-muted-foreground">Created</div>
                <div className="font-medium">
                  {new Date(user.createdAt).toLocaleString()}
                </div>
              </div>

              <div>
                <div className="text-sm text-muted-foreground">
                  Moderation State
                </div>
                <ModerationStateBadge state={user.moderationState} />
              </div>

              <div>
                <div className="text-sm text-muted-foreground">
                  Block Status
                </div>
                <BlockStatusBadge softBlockedUntil={user.softBlockedUntil} />
              </div>

              <div>
                <div className="text-sm text-muted-foreground">
                  Strike Count
                </div>
                <div className="font-medium">{user.moderationStrikeCount}</div>
              </div>

              <div>
                <div className="text-sm text-muted-foreground">Risk Score</div>
                <div className="font-medium">{user.moderationRiskScore}</div>
              </div>

              <div>
                <div className="text-sm text-muted-foreground">
                  Last Incident
                </div>
                <div className="font-medium">
                  {user.moderationLastIncidentAt
                    ? new Date(user.moderationLastIncidentAt).toLocaleString()
                    : "N/A"}
                </div>
              </div>

              <div>
                <div className="text-sm text-muted-foreground">
                  Soft Blocked Until
                </div>
                <div className="font-medium">
                  {user.softBlockedUntil
                    ? new Date(user.softBlockedUntil).toLocaleString()
                    : "N/A"}
                </div>
              </div>

              <div>
                <div className="text-sm text-muted-foreground">
                  Incident Count
                </div>
                <div className="font-medium">
                  {user._count.moderationIncidents}
                </div>
              </div>

              <div>
                <div className="text-sm text-muted-foreground">
                  Reports Against
                </div>
                <div className="font-medium">{user._count.reportsAgainst}</div>
              </div>

              <div>
                <div className="text-sm text-muted-foreground">
                  Reports Submitted
                </div>
                <div className="font-medium">
                  {user._count.reportsSubmitted}
                </div>
              </div>

              <div>
                <div className="text-sm text-muted-foreground">
                  Refund Count
                </div>
                <div className="font-medium">{user.refundCount ?? 0}</div>
              </div>

              <div>
                <div className="text-sm text-muted-foreground">
                  Dispute Count
                </div>
                <div className="font-medium">{user.disputeCount ?? 0}</div>
              </div>

              <div>
                <div className="text-sm text-muted-foreground">Banned</div>
                <div className="font-medium">
                  {user.isBanned ? "Yes" : "No"}
                </div>
              </div>
            </div>
          </PremiumSection>

          <PremiumSection
            title="Moderator Actions"
            description="Apply temporary restrictions or reset the moderation summary."
          >
            <ModerationUserActionButtons
              userId={user.id}
              softBlockedUntil={
                user.softBlockedUntil ? user.softBlockedUntil.toISOString() : null
              }
            />
          </PremiumSection>

          <PremiumSection
            title="Incident History"
            description="Recent moderation incidents associated with this user."
          >
            <div className="space-y-3">
              {incidentHistory.length === 0 ? (
                <div className="text-sm text-muted-foreground">
                  No incident history for this user.
                </div>
              ) : (
                incidentHistory.map((incident) => (
                  <div key={incident.id} className="rounded-xl border p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="font-medium">{incident.reason}</div>
                        <div className="text-xs text-muted-foreground">
                          {incident.targetType} / {incident.targetId}
                        </div>
                      </div>
                      <ModerationStateBadge state={incident.status} />
                    </div>

                    <div className="mt-2 text-xs text-muted-foreground">
                      {incident.decision} / {incident.severity} / strike{" "}
                      {incident.strikeWeight} /{" "}
                      {new Date(incident.createdAt).toLocaleString()}
                    </div>

                    <div className="mt-3">
                      <Button asChild variant="outline" size="sm">
                        <Link
                          href={`/marketplace/dashboard/moderator/incidents/${incident.id}`}
                        >
                          Open Incident
                        </Link>
                      </Button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </PremiumSection>
        </div>

        <div className="space-y-6">
          <PremiumSection
            title="Reports Against User"
            description="Recent user reports and any linked moderation incidents."
          >
            <div className="space-y-3">
              {reportsAgainst.length === 0 ? (
                <div className="text-sm text-muted-foreground">
                  No reports against this user.
                </div>
              ) : (
                reportsAgainst.map((report) => (
                  <div key={report.id} className="rounded-xl border p-4">
                    <div className="font-medium">{report.reason}</div>
                    <div className="text-xs text-muted-foreground">
                      {report.targetType} / {report.targetId}
                    </div>

                    <div className="mt-2 text-sm">
                      {report.description || "No description provided."}
                    </div>

                    <div className="mt-2 text-xs text-muted-foreground">
                      Reporter:{" "}
                      {report.reporter.name ||
                        report.reporter.username ||
                        report.reporter.email}
                    </div>

                    <div className="mt-1 text-xs text-muted-foreground">
                      {new Date(report.createdAt).toLocaleString()}
                    </div>

                    <div className="mt-3 flex flex-wrap gap-2">
                      <Button asChild variant="outline" size="sm">
                        <Link
                          href={`/marketplace/dashboard/moderator/reports/${report.id}`}
                        >
                          Open Report
                        </Link>
                      </Button>

                      {report.moderationIncident ? (
                        <Button asChild variant="outline" size="sm">
                          <Link
                            href={`/marketplace/dashboard/moderator/incidents/${report.moderationIncident.id}`}
                          >
                            Linked Incident
                          </Link>
                        </Button>
                      ) : null}
                    </div>
                  </div>
                ))
              )}
            </div>
          </PremiumSection>
        </div>
      </div>
    </div>
  );
}
