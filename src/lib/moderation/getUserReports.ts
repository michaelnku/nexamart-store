import { unstable_noStore as noStore } from "next/cache";
import {
  UserReportReason,
  UserReportStatus,
  UserReportTargetType,
} from "@/generated/prisma";
import { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import {
  normalizeSearchText,
  omitAllFilter,
  resolvePage,
} from "@/lib/moderation/queryHelpers";

export type UserReportListFilters = {
  page?: number;
  q?: string;
  status?: UserReportStatus | "ALL";
  reason?: UserReportReason | "ALL";
  targetType?: UserReportTargetType | "ALL";
};

export const MODERATION_REPORTS_PAGE_SIZE = 24;

function buildUserReportWhere(
  filters: UserReportListFilters,
): Prisma.UserReportWhereInput {
  const q = normalizeSearchText(filters.q);
  const conditions: Prisma.UserReportWhereInput[] = [];
  const status = omitAllFilter(filters.status);
  const reason = omitAllFilter(filters.reason);
  const targetType = omitAllFilter(filters.targetType);

  if (status) {
    conditions.push({ status });
  }

  if (reason) {
    conditions.push({ reason });
  }

  if (targetType) {
    conditions.push({ targetType });
  }

  if (q) {
    conditions.push({
      OR: [
        { id: { contains: q, mode: "insensitive" } },
        { targetId: { contains: q, mode: "insensitive" } },
        { description: { contains: q, mode: "insensitive" } },
        {
          reporter: {
            is: {
              OR: [
                { name: { contains: q, mode: "insensitive" } },
                { email: { contains: q, mode: "insensitive" } },
                { username: { contains: q, mode: "insensitive" } },
              ],
            },
          },
        },
        {
          reportedUser: {
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

export async function getUserReports(filters: UserReportListFilters) {
  noStore();
  const page = resolvePage(filters.page);
  const where = buildUserReportWhere(filters);
  const totalItems = await prisma.userReport.count({ where });
  const totalPages = Math.max(
    1,
    Math.ceil(totalItems / MODERATION_REPORTS_PAGE_SIZE),
  );
  const effectivePage = Math.min(page, totalPages);

  const items = await prisma.userReport.findMany({
    where,
    include: {
      reporter: {
        select: {
          id: true,
          name: true,
          email: true,
          username: true,
          role: true,
        },
      },
      reportedUser: {
        select: {
          id: true,
          name: true,
          email: true,
          username: true,
          role: true,
        },
      },
      reviewedBy: {
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
          status: true,
          severity: true,
          reviewStatus: true,
        },
      },
    },
    orderBy: [{ createdAt: "desc" }],
    skip: (effectivePage - 1) * MODERATION_REPORTS_PAGE_SIZE,
    take: MODERATION_REPORTS_PAGE_SIZE,
  });

  return {
    items,
    pagination: {
      page: effectivePage,
      pageSize: MODERATION_REPORTS_PAGE_SIZE,
      totalItems,
      totalPages,
      hasNextPage: effectivePage < totalPages,
      hasPreviousPage: effectivePage > 1,
    },
  };
}

export async function getUserReportOverview(filters: UserReportListFilters) {
  noStore();
  const baseWhere = buildUserReportWhere(filters);

  const [openCount, underReviewCount, linkedIncidentCount] =
    await prisma.$transaction([
      prisma.userReport.count({
        where: { AND: [baseWhere, { status: "OPEN" }] },
      }),
      prisma.userReport.count({
        where: { AND: [baseWhere, { status: "UNDER_REVIEW" }] },
      }),
      prisma.userReport.count({
        where: { AND: [baseWhere, { moderationIncidentId: { not: null } }] },
      }),
    ]);

  return {
    openCount,
    underReviewCount,
    linkedIncidentCount,
  };
}

export async function getUserReportById(reportId: string) {
  return prisma.userReport.findUnique({
    where: { id: reportId },
    include: {
      reporter: {
        select: {
          id: true,
          name: true,
          email: true,
          username: true,
          role: true,
        },
      },
      reportedUser: {
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
      reviewedBy: {
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
          status: true,
          severity: true,
          reviewStatus: true,
          decision: true,
        },
      },
    },
  });
}
