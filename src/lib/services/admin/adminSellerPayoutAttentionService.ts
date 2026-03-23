import { Prisma } from "@/generated/prisma";

import { prisma } from "@/lib/prisma";

export function buildSellerPayoutAdminAttentionWhere(
  now: Date = new Date(),
): Prisma.OrderSellerGroupWhereInput {
  return {
    payoutStatus: "PENDING",
    payoutReleasedAt: null,
    sellerRevenue: { gt: 0 },
    payoutEligibleAt: {
      not: null,
      lte: now,
    },
    order: {
      isPaid: true,
      status: {
        in: ["DELIVERED", "DISPUTED"],
      },
    },
  };
}

export async function countSellerPayoutAdminAttention(
  now: Date = new Date(),
): Promise<number> {
  return prisma.orderSellerGroup.count({
    where: buildSellerPayoutAdminAttentionWhere(now),
  });
}

export function buildSellerPayoutPipelineWhere(): Prisma.OrderSellerGroupWhereInput {
  return {
    payoutStatus: "PENDING",
    payoutReleasedAt: null,
    sellerRevenue: { gt: 0 },
    order: {
      isPaid: true,
      status: {
        not: "CANCELLED",
      },
    },
  };
}

export async function countSellerGroupsInPayoutPipeline(): Promise<number> {
  return prisma.orderSellerGroup.count({
    where: buildSellerPayoutPipelineWhere(),
  });
}
