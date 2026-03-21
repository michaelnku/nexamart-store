import Link from "next/link";
import { notFound } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { requireModerator } from "@/lib/moderation/guardModerator";
import { getUserReportById } from "@/lib/moderation/getUserReports";
import { ReportStatusBadge } from "../_components/ReportBadges";
import { ReportActionButtons } from "./_components/ReportActionButtons";

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
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Report Details</h1>
          <p className="text-sm text-muted-foreground">
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
          <Card className="rounded-2xl">
            <CardHeader>
              <CardTitle>Report Summary</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4 md:grid-cols-2">
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
            </CardContent>
          </Card>

          <Card className="rounded-2xl">
            <CardHeader>
              <CardTitle>Reporter Statement</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="rounded-xl border p-4 text-sm">
                {report.description || "No description provided by the reporter."}
              </div>
            </CardContent>
          </Card>

          <Card className="rounded-2xl">
            <CardHeader>
              <CardTitle>Report Actions</CardTitle>
            </CardHeader>
            <CardContent>
              <ReportActionButtons reportId={report.id} status={report.status} />
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card className="rounded-2xl">
            <CardHeader>
              <CardTitle>Reporter</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
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
            </CardContent>
          </Card>

          <Card className="rounded-2xl">
            <CardHeader>
              <CardTitle>Reported Entity</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
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
            </CardContent>
          </Card>

          <Card className="rounded-2xl">
            <CardHeader>
              <CardTitle>Moderation Link</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
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
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
