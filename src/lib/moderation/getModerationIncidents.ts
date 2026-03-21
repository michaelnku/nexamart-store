import {
  ModerationSeverity,
  ModerationStatus,
  ModerationTargetType,
  ReviewStatus,
} from "@/generated/prisma";
import { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";

export type IncidentListFilters = {
  q?: string;
  status?: ModerationStatus | "ALL";
  reviewStatus?: ReviewStatus | "ALL";
  severity?: ModerationSeverity | "ALL";
  targetType?: ModerationTargetType | "ALL";
  source?: "ALL" | "AI" | "HUMAN";
};

function buildModerationIncidentWhere(
  filters: IncidentListFilters,
): Prisma.ModerationIncidentWhereInput {
  const q = filters.q?.trim();

  return {
    ...(filters.status && filters.status !== "ALL"
      ? { status: filters.status }
      : {}),
    ...(filters.reviewStatus && filters.reviewStatus !== "ALL"
      ? { reviewStatus: filters.reviewStatus }
      : {}),
    ...(filters.severity && filters.severity !== "ALL"
      ? { severity: filters.severity }
      : {}),
    ...(filters.targetType && filters.targetType !== "ALL"
      ? { targetType: filters.targetType }
      : {}),
    ...(filters.source === "AI"
      ? { actorModerator: { type: "AI" } }
      : filters.source === "HUMAN"
        ? { actorModerator: { type: "HUMAN" } }
        : {}),
    ...(q
      ? {
          OR: [
            { id: { contains: q, mode: "insensitive" } },
            { reason: { contains: q, mode: "insensitive" } },
            { policyCode: { contains: q, mode: "insensitive" } },
            { targetId: { contains: q, mode: "insensitive" } },
            {
              subjectUser: {
                is: {
                  OR: [
                    { name: { contains: q, mode: "insensitive" } },
                    { email: { contains: q, mode: "insensitive" } },
                    { username: { contains: q, mode: "insensitive" } },
                  ],
                },
              },
            },
          ],
        }
      : {}),
  };
}

export async function getModerationIncidents(filters: IncidentListFilters) {
  const incidents = await prisma.moderationIncident.findMany({
    where: buildModerationIncidentWhere(filters),
    include: {
      subjectUser: {
        select: {
          id: true,
          name: true,
          email: true,
          username: true,
          role: true,
          moderationStrikeCount: true,
          moderationRiskScore: true,
          softBlockedUntil: true,
        },
      },
      actorModerator: {
        select: {
          id: true,
          type: true,
          displayName: true,
        },
      },
      reviewerModerator: {
        select: {
          id: true,
          type: true,
          displayName: true,
        },
      },
    },
    orderBy: [
      { severity: "desc" },
      { reviewStatus: "desc" },
      { createdAt: "desc" },
    ],
    take: 100,
  });

  return incidents;
}

export async function getModerationIncidentOverview(
  filters: IncidentListFilters,
) {
  const baseWhere = buildModerationIncidentWhere(filters);

  const [openCount, pendingReviewCount, criticalCount] =
    await prisma.$transaction([
      prisma.moderationIncident.count({
        where: { AND: [baseWhere, { status: "OPEN" }] },
      }),
      prisma.moderationIncident.count({
        where: {
          AND: [baseWhere, { reviewStatus: "PENDING_HUMAN_REVIEW" }],
        },
      }),
      prisma.moderationIncident.count({
        where: { AND: [baseWhere, { severity: "CRITICAL" }] },
      }),
    ]);

  return {
    openCount,
    pendingReviewCount,
    criticalCount,
  };
}

export async function getModerationIncidentById(incidentId: string) {
  return prisma.moderationIncident.findUnique({
    where: { id: incidentId },
    include: {
      subjectUser: {
        select: {
          id: true,
          name: true,
          email: true,
          username: true,
          role: true,
          moderationStrikeCount: true,
          moderationRiskScore: true,
          moderationState: true,
          moderationLastIncidentAt: true,
          softBlockedUntil: true,
          disputeCount: true,
          refundCount: true,
          isBanned: true,
          createdAt: true,
        },
      },
      actorModerator: {
        select: {
          id: true,
          displayName: true,
          type: true,
        },
      },
      reviewerModerator: {
        select: {
          id: true,
          displayName: true,
          type: true,
        },
      },
    },
  });
}

export async function getUserRecentIncidents(userId: string) {
  return prisma.moderationIncident.findMany({
    where: { subjectUserId: userId },
    orderBy: { createdAt: "desc" },
    take: 8,
    select: {
      id: true,
      reason: true,
      decision: true,
      severity: true,
      status: true,
      strikeWeight: true,
      createdAt: true,
    },
  });
}
