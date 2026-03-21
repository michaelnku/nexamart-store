import Link from "next/link";
import { notFound } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { requireModerator } from "@/lib/moderation/guardModerator";
import {
  getModerationIncidentById,
  getUserRecentIncidents,
} from "@/lib/moderation/getModerationIncidents";
import {
  ReviewStatusBadge,
  SeverityBadge,
  SourceBadge,
  StatusBadge,
} from "../_components/IncidentBadges";
import { IncidentActionButtons } from "./_components/IncidentActionButtons";

export default async function IncidentDetailsPage(props: {
  params: Promise<{ incidentId: string }>;
}) {
  await requireModerator();
  const { incidentId } = await props.params;

  const incident = await getModerationIncidentById(incidentId);

  if (!incident) {
    notFound();
  }

  const recentIncidents = incident.subjectUserId
    ? await getUserRecentIncidents(incident.subjectUserId)
    : [];

  const source = incident.actorModerator?.type ?? "UNKNOWN";

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            Incident Details
          </h1>
          <p className="text-sm text-muted-foreground">
            Review incident evidence, user context, and moderator actions.
          </p>
        </div>

        <Button asChild variant="outline">
          <Link href="/marketplace/dashboard/moderator/incidents">
            Back to Incidents
          </Link>
        </Button>
      </div>

      <div className="grid gap-6 xl:grid-cols-3">
        <div className="space-y-6 xl:col-span-2">
          <Card className="rounded-2xl">
            <CardHeader>
              <CardTitle>Incident Summary</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4 md:grid-cols-2">
              <div>
                <div className="text-sm text-muted-foreground">Incident ID</div>
                <div className="font-medium">{incident.id}</div>
              </div>

              <div>
                <div className="text-sm text-muted-foreground">Target</div>
                <div className="font-medium">
                  {incident.targetType} / {incident.targetId}
                </div>
              </div>

              <div>
                <div className="text-sm text-muted-foreground">Decision</div>
                <div className="font-medium">{incident.decision}</div>
              </div>

              <div>
                <div className="text-sm text-muted-foreground">Policy Code</div>
                <div className="font-medium">{incident.policyCode ?? "N/A"}</div>
              </div>

              <div>
                <div className="text-sm text-muted-foreground">Severity</div>
                <SeverityBadge severity={incident.severity} />
              </div>

              <div>
                <div className="text-sm text-muted-foreground">Status</div>
                <StatusBadge status={incident.status} />
              </div>

              <div>
                <div className="text-sm text-muted-foreground">
                  Review Status
                </div>
                <ReviewStatusBadge reviewStatus={incident.reviewStatus} />
              </div>

              <div>
                <div className="text-sm text-muted-foreground">Source</div>
                <SourceBadge source={source} />
              </div>

              <div>
                <div className="text-sm text-muted-foreground">Confidence</div>
                <div className="font-medium">
                  {incident.confidence != null
                    ? `${Math.round(incident.confidence * 100)}%`
                    : "N/A"}
                </div>
              </div>

              <div>
                <div className="text-sm text-muted-foreground">
                  Strike Weight
                </div>
                <div className="font-medium">{incident.strikeWeight}</div>
              </div>

              <div>
                <div className="text-sm text-muted-foreground">Created</div>
                <div className="font-medium">
                  {new Date(incident.createdAt).toLocaleString()}
                </div>
              </div>

              <div>
                <div className="text-sm text-muted-foreground">Resolved</div>
                <div className="font-medium">
                  {incident.resolvedAt
                    ? new Date(incident.resolvedAt).toLocaleString()
                    : "N/A"}
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="rounded-2xl">
            <CardHeader>
              <CardTitle>Reasoning</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <div className="mb-1 text-sm text-muted-foreground">Reason</div>
                <div className="rounded-xl border p-4 text-sm">
                  {incident.reason}
                </div>
              </div>

              <div>
                <div className="mb-1 text-sm text-muted-foreground">
                  Evidence
                </div>
                <pre className="overflow-x-auto rounded-xl border p-4 text-xs">
                  {JSON.stringify(incident.evidence ?? {}, null, 2)}
                </pre>
              </div>

              <div>
                <div className="mb-1 text-sm text-muted-foreground">
                  Metadata
                </div>
                <pre className="overflow-x-auto rounded-xl border p-4 text-xs">
                  {JSON.stringify(incident.metadata ?? {}, null, 2)}
                </pre>
              </div>
            </CardContent>
          </Card>

          <Card className="rounded-2xl">
            <CardHeader>
              <CardTitle>Moderator Actions</CardTitle>
            </CardHeader>
            <CardContent>
              <IncidentActionButtons
                incidentId={incident.id}
                status={incident.status}
                reviewStatus={incident.reviewStatus}
              />
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card className="rounded-2xl">
            <CardHeader>
              <CardTitle>Subject User</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {incident.subjectUser ? (
                <>
                  <div>
                    <div className="text-sm text-muted-foreground">Name</div>
                    <div className="font-medium">
                      {incident.subjectUser.name ||
                        incident.subjectUser.username ||
                        "N/A"}
                    </div>
                  </div>

                  <div>
                    <div className="text-sm text-muted-foreground">Email</div>
                    <div className="font-medium">
                      {incident.subjectUser.email}
                    </div>
                  </div>

                  <div>
                    <div className="text-sm text-muted-foreground">Role</div>
                    <div className="font-medium">
                      {incident.subjectUser.role}
                    </div>
                  </div>

                  <div>
                    <div className="text-sm text-muted-foreground">Strikes</div>
                    <div className="font-medium">
                      {incident.subjectUser.moderationStrikeCount}
                    </div>
                  </div>

                  <div>
                    <div className="text-sm text-muted-foreground">
                      Risk Score
                    </div>
                    <div className="font-medium">
                      {incident.subjectUser.moderationRiskScore}
                    </div>
                  </div>

                  <div>
                    <div className="text-sm text-muted-foreground">State</div>
                    <div className="font-medium">
                      {incident.subjectUser.moderationState ?? "CLEAR"}
                    </div>
                  </div>

                  <div>
                    <div className="text-sm text-muted-foreground">
                      Soft Blocked Until
                    </div>
                    <div className="font-medium">
                      {incident.subjectUser.softBlockedUntil
                        ? new Date(
                            incident.subjectUser.softBlockedUntil,
                          ).toLocaleString()
                        : "N/A"}
                    </div>
                  </div>

                  <div>
                    <div className="text-sm text-muted-foreground">
                      Refund Count
                    </div>
                    <div className="font-medium">
                      {incident.subjectUser.refundCount ?? 0}
                    </div>
                  </div>

                  <div>
                    <div className="text-sm text-muted-foreground">
                      Dispute Count
                    </div>
                    <div className="font-medium">
                      {incident.subjectUser.disputeCount ?? 0}
                    </div>
                  </div>

                  <div>
                    <div className="text-sm text-muted-foreground">Banned</div>
                    <div className="font-medium">
                      {incident.subjectUser.isBanned ? "Yes" : "No"}
                    </div>
                  </div>
                </>
              ) : (
                <div className="text-sm text-muted-foreground">
                  No subject user attached to this incident.
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="rounded-2xl">
            <CardHeader>
              <CardTitle>Recent Incidents</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {recentIncidents.length === 0 ? (
                <div className="text-sm text-muted-foreground">
                  No recent incidents for this user.
                </div>
              ) : (
                recentIncidents.map((item) => (
                  <div key={item.id} className="rounded-xl border p-3">
                    <div className="flex items-center justify-between gap-3">
                      <div className="font-medium">{item.reason}</div>
                      <SeverityBadge severity={item.severity} />
                    </div>

                    <div className="mt-1 text-xs text-muted-foreground">
                      {item.decision} / strike {item.strikeWeight} /{" "}
                      {new Date(item.createdAt).toLocaleString()}
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>

          <Card className="rounded-2xl">
            <CardHeader>
              <CardTitle>Review Metadata</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div>
                <div className="text-muted-foreground">Actor Moderator</div>
                <div className="font-medium">
                  {incident.actorModerator?.displayName ?? "N/A"}
                </div>
              </div>

              <div>
                <div className="text-muted-foreground">Reviewer Moderator</div>
                <div className="font-medium">
                  {incident.reviewerModerator?.displayName ?? "N/A"}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
