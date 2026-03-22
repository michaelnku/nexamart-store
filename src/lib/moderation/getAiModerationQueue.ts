import { unstable_noStore as noStore } from "next/cache";
import { prisma } from "@/lib/prisma";
import {
  ModerationSeverity,
  ModerationStatus,
  ModerationTargetType,
  Prisma,
  ReviewStatus,
} from "@/generated/prisma";
import {
  normalizeSearchText,
  omitAllFilter,
  resolvePage,
} from "@/lib/moderation/queryHelpers";

export type AiModerationQueueFilters = {
  page?: number;
  q?: string;
  status?: ModerationStatus | "ALL";
  reviewStatus?: ReviewStatus | "ALL";
  severity?: ModerationSeverity | "ALL";
  targetType?: ModerationTargetType | "ALL";
  pendingOnly?: boolean;
};

export const AI_MODERATION_PAGE_SIZE = 24;

const aiModerationQueueInclude = {
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
} satisfies Prisma.ModerationIncidentInclude;

export type AiModerationQueueItem = Prisma.ModerationIncidentGetPayload<{
  include: typeof aiModerationQueueInclude;
}>;

function buildAiModerationQueueWhere(
  filters: AiModerationQueueFilters,
): Prisma.ModerationIncidentWhereInput {
  const q = normalizeSearchText(filters.q);
  const conditions: Prisma.ModerationIncidentWhereInput[] = [
    {
      actorModerator: {
        is: {
          type: "AI",
        },
      },
    },
  ];
  const status = omitAllFilter(filters.status);
  const reviewStatus = omitAllFilter(filters.reviewStatus);
  const severity = omitAllFilter(filters.severity);
  const targetType = omitAllFilter(filters.targetType);

  if (filters.pendingOnly) {
    conditions.push({ reviewStatus: "PENDING_HUMAN_REVIEW" });
  }

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

  return { AND: conditions };
}

export async function getAiModerationQueue(filters: AiModerationQueueFilters) {
  noStore();
  const page = resolvePage(filters.page);
  const where = buildAiModerationQueueWhere(filters);
  const totalItems = await prisma.moderationIncident.count({ where });
  const totalPages = Math.max(1, Math.ceil(totalItems / AI_MODERATION_PAGE_SIZE));
  const effectivePage = Math.min(page, totalPages);

  const items = await prisma.moderationIncident.findMany({
    where,
    include: aiModerationQueueInclude,
    orderBy: [{ severity: "desc" }, { createdAt: "desc" }],
    skip: (effectivePage - 1) * AI_MODERATION_PAGE_SIZE,
    take: AI_MODERATION_PAGE_SIZE,
  });

  return {
    items,
    pagination: {
      page: effectivePage,
      pageSize: AI_MODERATION_PAGE_SIZE,
      totalItems,
      totalPages,
      hasNextPage: effectivePage < totalPages,
      hasPreviousPage: effectivePage > 1,
    },
  };
}

export async function getAiModerationQueueOverview(
  filters: AiModerationQueueFilters,
) {
  noStore();
  const baseWhere = buildAiModerationQueueWhere(filters);

  const [pendingCount, openCount, highPriorityCount] = await prisma.$transaction([
    prisma.moderationIncident.count({
      where: { AND: [baseWhere, { reviewStatus: "PENDING_HUMAN_REVIEW" }] },
    }),
    prisma.moderationIncident.count({
      where: { AND: [baseWhere, { status: "OPEN" }] },
    }),
    prisma.moderationIncident.count({
      where: { AND: [baseWhere, { severity: { in: ["HIGH", "CRITICAL"] } }] },
    }),
  ]);

  return {
    pendingCount,
    openCount,
    highPriorityCount,
  };
}
