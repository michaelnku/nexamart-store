import {
  UserReportReason,
  UserReportStatus,
  UserReportTargetType,
} from "@/generated/prisma";
import { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";

export type UserReportListFilters = {
  q?: string;
  status?: UserReportStatus | "ALL";
  reason?: UserReportReason | "ALL";
  targetType?: UserReportTargetType | "ALL";
};

function buildUserReportWhere(
  filters: UserReportListFilters,
): Prisma.UserReportWhereInput {
  const q = filters.q?.trim();

  return {
    ...(filters.status && filters.status !== "ALL"
      ? { status: filters.status }
      : {}),
    ...(filters.reason && filters.reason !== "ALL"
      ? { reason: filters.reason }
      : {}),
    ...(filters.targetType && filters.targetType !== "ALL"
      ? { targetType: filters.targetType }
      : {}),
    ...(q
      ? {
          OR: [
            { id: { contains: q, mode: "insensitive" } },
            { targetId: { contains: q, mode: "insensitive" } },
            { description: { contains: q, mode: "insensitive" } },
            {
              reporter: {
                OR: [
                  { name: { contains: q, mode: "insensitive" } },
                  { email: { contains: q, mode: "insensitive" } },
                  { username: { contains: q, mode: "insensitive" } },
                ],
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
        }
      : {}),
  };
}

export async function getUserReports(filters: UserReportListFilters) {
  return prisma.userReport.findMany({
    where: buildUserReportWhere(filters),
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
    take: 100,
  });
}

export async function getUserReportOverview(filters: UserReportListFilters) {
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
