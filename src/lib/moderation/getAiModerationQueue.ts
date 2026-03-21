import { prisma } from "@/lib/prisma";
import {
  ModerationSeverity,
  ModerationStatus,
  ModerationTargetType,
  ReviewStatus,
} from "@/generated/prisma";

export type AiModerationQueueFilters = {
  q?: string;
  status?: ModerationStatus | "ALL";
  reviewStatus?: ReviewStatus | "ALL";
  severity?: ModerationSeverity | "ALL";
  targetType?: ModerationTargetType | "ALL";
  pendingOnly?: boolean;
};

export async function getAiModerationQueue(filters: AiModerationQueueFilters) {
  const q = filters.q?.trim();

  return prisma.moderationIncident.findMany({
    where: {
      actorModerator: {
        is: {
          type: "AI",
        },
      },
      ...(filters.pendingOnly
        ? {
            reviewStatus: "PENDING_HUMAN_REVIEW",
          }
        : {}),
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
    },
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
    orderBy: [{ severity: "desc" }, { createdAt: "desc" }],
    take: 100,
  });
}
