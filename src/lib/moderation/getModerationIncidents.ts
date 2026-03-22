import { unstable_noStore as noStore } from "next/cache";
import {
  ModerationSeverity,
  ModerationStatus,
  ModerationTargetType,
  ReviewStatus,
} from "@/generated/prisma";
import { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import {
  normalizeSearchText,
  omitAllFilter,
  resolvePage,
} from "@/lib/moderation/queryHelpers";

export type IncidentListFilters = {
  page?: number;
  q?: string;
  status?: ModerationStatus | "ALL";
  reviewStatus?: ReviewStatus | "ALL";
  severity?: ModerationSeverity | "ALL";
  targetType?: ModerationTargetType | "ALL";
  source?: "ALL" | "AI" | "HUMAN";
};

export const MODERATION_INCIDENTS_PAGE_SIZE = 24;

function buildModerationIncidentWhere(
  filters: IncidentListFilters,
): Prisma.ModerationIncidentWhereInput {
  const q = normalizeSearchText(filters.q);
  const conditions: Prisma.ModerationIncidentWhereInput[] = [];
  const status = omitAllFilter(filters.status);
  const reviewStatus = omitAllFilter(filters.reviewStatus);
  const severity = omitAllFilter(filters.severity);
  const targetType = omitAllFilter(filters.targetType);

  if (status) {
    conditions.push({ status });
  }

  if (reviewStatus) {
    conditions.push({ reviewStatus });
  }

  if (severity) {
    conditions.push({ severity });
  }

  if (targetType) {
    conditions.push({ targetType });
  }

  if (filters.source === "AI") {
    conditions.push({ actorModerator: { is: { type: "AI" } } });
  } else if (filters.source === "HUMAN") {
    conditions.push({ actorModerator: { is: { type: "HUMAN" } } });
  }

  if (q) {
    conditions.push({
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
    });
  }

  return conditions.length > 0 ? { AND: conditions } : {};
}

export async function getModerationIncidents(filters: IncidentListFilters) {
  noStore();
  const page = resolvePage(filters.page);
  const where = buildModerationIncidentWhere(filters);
  const totalItems = await prisma.moderationIncident.count({ where });
  const totalPages = Math.max(
    1,
    Math.ceil(totalItems / MODERATION_INCIDENTS_PAGE_SIZE),
  );
  const effectivePage = Math.min(page, totalPages);

  const items = await prisma.moderationIncident.findMany({
    where,
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
    skip: (effectivePage - 1) * MODERATION_INCIDENTS_PAGE_SIZE,
    take: MODERATION_INCIDENTS_PAGE_SIZE,
  });

  return {
    items,
    pagination: {
      page: effectivePage,
      pageSize: MODERATION_INCIDENTS_PAGE_SIZE,
      totalItems,
      totalPages,
      hasNextPage: effectivePage < totalPages,
      hasPreviousPage: effectivePage > 1,
    },
  };
}

export async function getModerationIncidentOverview(
  filters: IncidentListFilters,
) {
  noStore();
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
