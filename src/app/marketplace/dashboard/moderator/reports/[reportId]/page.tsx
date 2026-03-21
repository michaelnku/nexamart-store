import Link from "next/link";
import { notFound } from "next/navigation";

import { Button } from "@/components/ui/button";
import { requireModerator } from "@/lib/moderation/guardModerator";
import { getUserReportById } from "@/lib/moderation/getUserReports";
import { ReportStatusBadge } from "../_components/ReportBadges";
import { ReportActionButtons } from "./_components/ReportActionButtons";

const styles = {
  premiumSurface:
    "overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-[0_22px_60px_-40px_rgba(15,23,42,0.35)] dark:border-zinc-800 dark:bg-zinc-950",
  sectionHeader:
    "border-b border-slate-200/80 bg-[linear-gradient(180deg,rgba(60,158,224,0.08),rgba(255,255,255,0.96))] px-6 py-4 dark:border-zinc-800 dark:bg-[linear-gradient(180deg,rgba(60,158,224,0.12),rgba(24,24,27,0.96))]",
  title: "text-base font-semibold text-slate-950 dark:text-zinc-100",
  description: "text-sm text-slate-500 dark:text-zinc-400",
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

export default async function ModeratorReportDetailsPage(props: {
  params: Promise<{ reportId: string }>;
}) {
  await requireModerator();
  const { reportId } = await props.params;

  const report = await getUserReportById(reportId);

  if (!report) {
    notFound();
  }

  return (
    <div className="space-y-6 text-slate-950 dark:text-zinc-100">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Report Details</h1>
          <p className="text-sm text-slate-500 dark:text-zinc-400">
            Review the complaint, target context, and moderation linkage.
          </p>
        </div>

        <Button asChild variant="outline">
          <Link href="/marketplace/dashboard/moderator/reports">
            Back to Reports
          </Link>
        </Button>
      </div>

      <div className="grid gap-6 xl:grid-cols-3">
        <div className="space-y-6 xl:col-span-2">
          <PremiumSection
            title="Report Summary"
            description="Core report metadata, status, target, and review timing."
          >
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <div className="text-sm text-muted-foreground">Report ID</div>
                <div className="font-medium">{report.id}</div>
              </div>

              <div>
                <div className="text-sm text-muted-foreground">Status</div>
                <ReportStatusBadge status={report.status} />
              </div>

              <div>
                <div className="text-sm text-muted-foreground">Target</div>
                <div className="font-medium">
                  {report.targetType} / {report.targetId}
                </div>
              </div>

              <div>
                <div className="text-sm text-muted-foreground">Reason</div>
                <div className="font-medium">{report.reason}</div>
              </div>

              <div>
                <div className="text-sm text-muted-foreground">Created</div>
                <div className="font-medium">
                  {new Date(report.createdAt).toLocaleString()}
                </div>
              </div>

              <div>
                <div className="text-sm text-muted-foreground">Reviewed At</div>
                <div className="font-medium">
                  {report.reviewedAt
                    ? new Date(report.reviewedAt).toLocaleString()
                    : "N/A"}
                </div>
              </div>
            </div>
          </PremiumSection>

          <PremiumSection
            title="Reporter Statement"
            description="The complaint text supplied by the reporting user."
          >
            <div className="rounded-xl border p-4 text-sm">
              {report.description || "No description provided by the reporter."}
            </div>
          </PremiumSection>

          <PremiumSection
            title="Report Actions"
            description="Move the report through the moderator review workflow."
          >
            <ReportActionButtons reportId={report.id} status={report.status} />
          </PremiumSection>
        </div>

        <div className="space-y-6">
          <PremiumSection
            title="Reporter"
            description="Identity and role of the user who submitted the report."
          >
            <div className="space-y-3">
              <div>
                <div className="text-sm text-muted-foreground">Name</div>
                <div className="font-medium">
                  {report.reporter.name || report.reporter.username || "N/A"}
                </div>
              </div>

              <div>
                <div className="text-sm text-muted-foreground">Email</div>
                <div className="font-medium">{report.reporter.email}</div>
              </div>

              <div>
                <div className="text-sm text-muted-foreground">Role</div>
                <div className="font-medium">{report.reporter.role}</div>
              </div>
            </div>
          </PremiumSection>

          <PremiumSection
            title="Reported Entity"
            description="Target metadata and current moderation profile for the reported user."
          >
            <div className="space-y-3">
              <div>
                <div className="text-sm text-muted-foreground">Target Type</div>
                <div className="font-medium">{report.targetType}</div>
              </div>

              <div>
                <div className="text-sm text-muted-foreground">Target ID</div>
                <div className="font-medium">{report.targetId}</div>
              </div>

              <div>
                <div className="text-sm text-muted-foreground">
                  Reported User
                </div>
                <div className="font-medium">
                  {report.reportedUser
                    ? report.reportedUser.name ||
                      report.reportedUser.username ||
                      report.reportedUser.email
                    : "N/A"}
                </div>
              </div>

              {report.reportedUser ? (
                <>
                  <div>
                    <div className="text-sm text-muted-foreground">
                      Strike Count
                    </div>
                    <div className="font-medium">
                      {report.reportedUser.moderationStrikeCount}
                    </div>
                  </div>

                  <div>
                    <div className="text-sm text-muted-foreground">
                      Risk Score
                    </div>
                    <div className="font-medium">
                      {report.reportedUser.moderationRiskScore}
                    </div>
                  </div>

                  <div>
                    <div className="text-sm text-muted-foreground">
                      Soft Blocked Until
                    </div>
                    <div className="font-medium">
                      {report.reportedUser.softBlockedUntil
                        ? new Date(
                            report.reportedUser.softBlockedUntil,
                          ).toLocaleString()
                        : "N/A"}
                    </div>
                  </div>
                </>
              ) : null}
            </div>
          </PremiumSection>

          <PremiumSection
            title="Moderation Link"
            description="Linked incident metadata and who reviewed the report."
          >
            <div className="space-y-3">
              {report.moderationIncident ? (
                <>
                  <div>
                    <div className="text-sm text-muted-foreground">Incident</div>
                    <Link
                      href={`/marketplace/dashboard/moderator/incidents/${report.moderationIncident.id}`}
                      className="font-medium underline underline-offset-4"
                    >
                      {report.moderationIncident.id}
                    </Link>
                  </div>

                  <div>
                    <div className="text-sm text-muted-foreground">
                      Decision
                    </div>
                    <div className="font-medium">
                      {report.moderationIncident.decision}
                    </div>
                  </div>

                  <div>
                    <div className="text-sm text-muted-foreground">
                      Severity
                    </div>
                    <div className="font-medium">
                      {report.moderationIncident.severity}
                    </div>
                  </div>

                  <div>
                    <div className="text-sm text-muted-foreground">
                      Review Status
                    </div>
                    <div className="font-medium">
                      {report.moderationIncident.reviewStatus}
                    </div>
                  </div>
                </>
              ) : (
                <div className="text-sm text-muted-foreground">
                  No moderation incident linked yet.
                </div>
              )}

              <div>
                <div className="text-sm text-muted-foreground">Reviewed By</div>
                <div className="font-medium">
                  {report.reviewedBy
                    ? report.reviewedBy.name ||
                      report.reviewedBy.username ||
                      report.reviewedBy.email
                    : "N/A"}
                </div>
              </div>
            </div>
          </PremiumSection>
        </div>
      </div>
    </div>
  );
}
