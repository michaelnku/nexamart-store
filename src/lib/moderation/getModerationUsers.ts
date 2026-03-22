import { unstable_noStore as noStore } from "next/cache";
import { UserRole } from "@/generated/prisma";
import { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import {
  normalizeSearchText,
  omitAllFilter,
  resolvePage,
} from "@/lib/moderation/queryHelpers";

export type ModerationUsersFilters = {
  page?: number;
  q?: string;
  role?: UserRole | "ALL";
  state?: "ALL" | "CLEAR" | "WARNED" | "RESTRICTED" | "SOFT_BLOCKED";
  blocked?: "ALL" | "YES" | "NO";
};

export const MODERATION_USERS_PAGE_SIZE = 24;

function buildModerationUsersWhere(
  filters: ModerationUsersFilters,
  now: Date,
): Prisma.UserWhereInput {
  const q = normalizeSearchText(filters.q);
  const conditions: Prisma.UserWhereInput[] = [];
  const role = omitAllFilter(filters.role);
  const state = omitAllFilter(filters.state);

  if (role) {
    conditions.push({ role });
  }

  if (state) {
    conditions.push({ moderationState: state });
  }

  if (filters.blocked === "YES") {
    conditions.push({ softBlockedUntil: { gt: now } });
  } else if (filters.blocked === "NO") {
    conditions.push({
      OR: [{ softBlockedUntil: null }, { softBlockedUntil: { lte: now } }],
    });
  }

  if (q) {
    conditions.push({
      OR: [
        { id: { contains: q, mode: "insensitive" } },
        { name: { contains: q, mode: "insensitive" } },
        { email: { contains: q, mode: "insensitive" } },
        { username: { contains: q, mode: "insensitive" } },
      ],
    });
  }

  return conditions.length > 0 ? { AND: conditions } : {};
}

export async function getModerationUsers(filters: ModerationUsersFilters) {
  noStore();
  const page = resolvePage(filters.page);
  const now = new Date();
  const where = buildModerationUsersWhere(filters, now);
  const totalItems = await prisma.user.count({ where });
  const totalPages = Math.max(1, Math.ceil(totalItems / MODERATION_USERS_PAGE_SIZE));
  const effectivePage = Math.min(page, totalPages);

  const items = await prisma.user.findMany({
    where,
    select: {
      id: true,
      name: true,
      email: true,
      username: true,
      role: true,
      isBanned: true,
      createdAt: true,
      moderationStrikeCount: true,
      moderationRiskScore: true,
      moderationState: true,
      moderationLastIncidentAt: true,
      softBlockedUntil: true,
      disputeCount: true,
      refundCount: true,
      _count: {
        select: {
          moderationIncidents: true,
          reportsAgainst: true,
        },
      },
    },
    orderBy: [
      { moderationRiskScore: "desc" },
      { moderationStrikeCount: "desc" },
      { createdAt: "desc" },
    ],
    skip: (effectivePage - 1) * MODERATION_USERS_PAGE_SIZE,
    take: MODERATION_USERS_PAGE_SIZE,
  });

  return {
    items,
    pagination: {
      page: effectivePage,
      pageSize: MODERATION_USERS_PAGE_SIZE,
      totalItems,
      totalPages,
      hasNextPage: effectivePage < totalPages,
      hasPreviousPage: effectivePage > 1,
    },
  };
}

export async function getModerationUsersOverview(
  filters: ModerationUsersFilters,
) {
  noStore();
  const now = new Date();
  const baseWhere = buildModerationUsersWhere(filters, now);

  const [blockedCount, warnedCount, highRiskCount] = await prisma.$transaction([
    prisma.user.count({
      where: { AND: [baseWhere, { softBlockedUntil: { gt: now } }] },
    }),
    prisma.user.count({
      where: {
        AND: [
          baseWhere,
          { moderationState: { in: ["WARNED", "RESTRICTED", "SOFT_BLOCKED"] } },
        ],
      },
    }),
    prisma.user.count({
      where: { AND: [baseWhere, { moderationRiskScore: { gte: 3 } }] },
    }),
  ]);

  return {
    blockedCount,
    warnedCount,
    highRiskCount,
  };
}

export async function getModerationUserById(userId: string) {
  return prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      name: true,
      email: true,
      username: true,
      role: true,
      isBanned: true,
      createdAt: true,
      moderationStrikeCount: true,
      moderationRiskScore: true,
      moderationState: true,
      moderationLastIncidentAt: true,
      softBlockedUntil: true,
      disputeCount: true,
      refundCount: true,
      _count: {
        select: {
          moderationIncidents: true,
          reportsAgainst: true,
          reportsSubmitted: true,
        },
      },
    },
  });
}

export async function getUserIncidentHistory(userId: string) {
  return prisma.moderationIncident.findMany({
    where: { subjectUserId: userId },
    orderBy: { createdAt: "desc" },
    take: 12,
    select: {
      id: true,
      targetType: true,
      targetId: true,
      decision: true,
      severity: true,
      status: true,
      reviewStatus: true,
      strikeWeight: true,
      reason: true,
      createdAt: true,
    },
  });
}

export async function getReportsAgainstUser(userId: string) {
  return prisma.userReport.findMany({
    where: { reportedUserId: userId },
    orderBy: { createdAt: "desc" },
    take: 12,
    select: {
      id: true,
      targetType: true,
      targetId: true,
      reason: true,
      status: true,
      description: true,
      createdAt: true,
      reporter: {
        select: {
          id: true,
          name: true,
          email: true,
          username: true,
        },
      },
      moderationIncident: {
        select: {
          id: true,
        },
      },
    },
  });
}
