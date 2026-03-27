import { Prisma, type DisputeStatus } from "@/generated/prisma";

import {
  AnalyticsDateRange,
  getAnalyticsBucketGranularity,
  getPreviousAnalyticsDateRange,
} from "@/lib/analytics/date-range";
import { calculateChange } from "@/lib/analytics/format";
import { prisma } from "@/lib/prisma";
import type { AdminDisputeDetailDTO } from "@/lib/types";

type TrendPoint = {
  bucket: string;
  label: string;
  value: number;
};

type BucketRow = {
  bucket: Date;
  value: number;
};

type CountBreakdown = {
  key: string;
  label: string;
  count: number;
};

type RankedCountRow = {
  key: string;
  label: string;
  value: number;
  secondaryValue?: number;
};

type RangeSummary = {
  disputesCreated: number;
  resolvedDisputes: number;
  rejectedDisputes: number;
  refundRecordedDisputes: number;
  refundRecordedAmount: number;
};

export type AdminDisputesDashboardResponse = {
  range: AnalyticsDateRange;
  snapshot: {
    totalDisputes: number;
    openDisputes: number;
    pendingReviewDisputes: number;
    underReviewDisputes: number;
    waitingForSellerDisputes: number;
    waitingForCustomerOrReturnDisputes: number;
  };
  rangeSummary: RangeSummary;
  changes: {
    disputesCreated: number | null;
    resolvedDisputes: number | null;
    rejectedDisputes: number | null;
    refundRecordedDisputes: number | null;
    refundRecordedAmount: number | null;
  };
  trends: {
    disputesCreated: TrendPoint[];
    resolvedDisputes: TrendPoint[];
    refundRecordedDisputes: TrendPoint[];
  };
  breakdowns: {
    disputesByReason: CountBreakdown[];
    disputesByStatus: CountBreakdown[];
    disputesByOrderType: CountBreakdown[];
    repeatStores: RankedCountRow[];
    repeatCustomers: RankedCountRow[];
  };
  urgentCases: AdminDisputeDetailDTO[];
  cases: AdminDisputeDetailDTO[];
};

const adminDisputeInclude = Prisma.validator<Prisma.DisputeInclude>()({
  openedBy: {
    select: { name: true },
  },
  resolvedBy: {
    select: { name: true },
  },
  evidence: {
    include: {
      fileAsset: true,
      uploadedBy: {
        select: { name: true },
      },
    },
    orderBy: { createdAt: "asc" },
  },
  linkedDeliveryEvidence: {
    include: {
      fileAsset: true,
      uploadedBy: {
        select: { name: true, role: true },
      },
    },
    orderBy: { createdAt: "asc" },
  },
  messages: {
    include: {
      sender: {
        select: { name: true },
      },
    },
    orderBy: { createdAt: "asc" },
  },
  returnRequest: true,
  order: {
    include: {
      customer: {
        select: { id: true, name: true, email: true },
      },
      delivery: {
        include: {
          rider: {
            select: { id: true, name: true, email: true },
          },
        },
      },
      orderTimelines: {
        orderBy: { createdAt: "asc" },
      },
      transactions: {
        where: {
          type: "REFUND",
          status: "SUCCESS",
          reference: {
            startsWith: "dispute-refund-",
          },
        },
        select: {
          id: true,
          amount: true,
          createdAt: true,
          reference: true,
        },
        orderBy: { createdAt: "desc" },
      },
    },
  },
  disputeSellerGroupImpacts: {
    include: {
      sellerGroup: {
        include: {
          seller: {
            select: { id: true, name: true, email: true },
          },
          store: {
            select: { id: true, name: true },
          },
        },
      },
    },
  },
});

type AdminDisputeRecord = Prisma.DisputeGetPayload<{
  include: typeof adminDisputeInclude;
}>;

function getRangeDates(range: Pick<AnalyticsDateRange, "startDate" | "endDate">) {
  return {
    rangeStartDate: new Date(range.startDate),
    rangeEndDate: new Date(range.endDate),
  };
}

function buildTrendPoints(
  rows: BucketRow[],
  granularity: "day" | "month",
): TrendPoint[] {
  const formatter = new Intl.DateTimeFormat(
    "en-US",
    granularity === "month"
      ? { month: "short", year: "numeric" }
      : { month: "short", day: "numeric" },
  );

  return rows.map((row) => ({
    bucket: row.bucket.toISOString(),
    label: formatter.format(new Date(row.bucket)),
    value: Number(row.value ?? 0),
  }));
}

function getAttentionLevel(
  status: DisputeStatus,
  createdAt: Date,
): { attentionLevel: "NORMAL" | "HIGH" | "CRITICAL"; attentionAgeHours: number } {
  const unresolved =
    status !== "RESOLVED" &&
    status !== "REJECTED";
  const attentionAgeHours = Math.max(
    0,
    Math.round((Date.now() - createdAt.getTime()) / (1000 * 60 * 60)),
  );

  if (!unresolved) {
    return { attentionLevel: "NORMAL", attentionAgeHours };
  }

  if (attentionAgeHours >= 72) {
    return { attentionLevel: "CRITICAL", attentionAgeHours };
  }

  if (attentionAgeHours >= 24) {
    return { attentionLevel: "HIGH", attentionAgeHours };
  }

  return { attentionLevel: "NORMAL", attentionAgeHours };
}

function mapDisputeToAdminDetail(dispute: AdminDisputeRecord): AdminDisputeDetailDTO {
  const disputeRefundTransaction = dispute.order.transactions.find((transaction) =>
    transaction.reference?.includes(dispute.id),
  );
  const { attentionLevel, attentionAgeHours } = getAttentionLevel(
    dispute.status,
    dispute.createdAt,
  );

  const disputeEvidence = dispute.evidence.map((item) => ({
    id: item.id,
    type: item.type,
    fileUrl: item.fileAsset.url,
    fileKey: item.fileAsset.storageKey,
    fileName: item.fileAsset.originalFileName,
    mimeType: item.fileAsset.mimeType,
    fileSize: item.fileAsset.fileSize,
    caption: item.caption,
    recordType: "DISPUTE_EVIDENCE" as const,
    visibility: item.visibility,
    isInternal: item.isInternal,
    deliveryEvidenceId: item.deliveryEvidenceId,
    uploadedById: item.uploadedById,
    uploadedByName: item.uploadedBy.name ?? null,
    createdAt: item.createdAt.toISOString(),
  }));
  const linkedDeliveryEvidence = dispute.linkedDeliveryEvidence
    .filter(
      (item) =>
        !disputeEvidence.some(
          (evidence) => evidence.deliveryEvidenceId === item.id,
        ),
    )
    .map((item) => ({
      id: item.id,
      type:
        item.fileAsset.mimeType?.startsWith("image/")
          ? "PHOTO"
          : item.fileAsset.mimeType?.startsWith("video/")
            ? "VIDEO"
            : "DOCUMENT",
      fileUrl: item.fileAsset.url,
      fileKey: item.fileAsset.storageKey,
      fileName: item.fileAsset.originalFileName,
      mimeType: item.fileAsset.mimeType,
      fileSize: item.fileAsset.fileSize,
      caption: item.caption,
      recordType: "DELIVERY_EVIDENCE" as const,
      deliveryKind: item.kind,
      visibility: item.visibility,
      isInternal: item.isInternal,
      uploadedById: item.uploadedById,
      uploadedByName: item.uploadedBy.name ?? null,
      uploadedByRole: item.uploadedBy.role,
      linkedDisputeId: item.linkedDisputeId,
      createdAt: item.createdAt.toISOString(),
      capturedAt: item.capturedAt?.toISOString() ?? null,
    }));

  return {
    id: dispute.id,
    orderId: dispute.orderId,
    status: dispute.status,
    reason: dispute.reason,
    resolution: dispute.resolution,
    description: dispute.description,
    refundAmount: dispute.refundAmount ?? disputeRefundTransaction?.amount ?? null,
    createdAt: dispute.createdAt.toISOString(),
    updatedAt: dispute.updatedAt.toISOString(),
    isFoodOrder: dispute.order.isFoodOrder,
    deliveryType: dispute.order.deliveryType,
    orderTrackingNumber: dispute.order.trackingNumber,
    openedByName: dispute.openedBy.name ?? null,
    resolvedByName: dispute.resolvedBy?.name ?? null,
    refundRecordedAt: disputeRefundTransaction?.createdAt.toISOString() ?? null,
    attentionLevel,
    attentionAgeHours,
    customer: {
      id: dispute.order.customer.id,
      name: dispute.order.customer.name,
      email: dispute.order.customer.email,
    },
    sellers: dispute.disputeSellerGroupImpacts.map((impact) => ({
      sellerId: impact.sellerGroup.seller.id,
      sellerName: impact.sellerGroup.seller.name,
      storeName: impact.sellerGroup.store.name,
      sellerGroupId: impact.sellerGroupId,
      refundAmount: impact.refundAmount,
      payoutLocked: impact.sellerGroup.payoutLocked,
      payoutStatus: impact.sellerGroup.payoutStatus,
      payoutReleasedAt: impact.sellerGroup.payoutReleasedAt?.toISOString() ?? null,
    })),
    delivery: dispute.order.delivery
      ? {
          id: dispute.order.delivery.id,
          status: dispute.order.delivery.status,
          riderId: dispute.order.delivery.riderId,
          riderName: dispute.order.delivery.rider?.name ?? null,
          riderEmail: dispute.order.delivery.rider?.email ?? null,
          deliveredAt: dispute.order.delivery.deliveredAt?.toISOString() ?? null,
          payoutLocked: dispute.order.delivery.payoutLocked,
          payoutReleasedAt:
            dispute.order.delivery.payoutReleasedAt?.toISOString() ?? null,
        }
      : null,
    evidence: [...disputeEvidence, ...linkedDeliveryEvidence].sort(
      (left, right) =>
        new Date(left.createdAt).getTime() - new Date(right.createdAt).getTime(),
    ),
    messages: dispute.messages.map((item) => ({
      id: item.id,
      senderId: item.senderId,
      senderName: item.sender.name ?? null,
      message: item.message,
      createdAt: item.createdAt.toISOString(),
    })),
    sellerImpacts: dispute.disputeSellerGroupImpacts.map((impact) => ({
      id: impact.id,
      sellerGroupId: impact.sellerGroupId,
      refundAmount: impact.refundAmount,
      sellerName: impact.sellerGroup.seller.name,
      storeName: impact.sellerGroup.store.name,
    })),
    returnRequest: dispute.returnRequest
      ? {
          id: dispute.returnRequest.id,
          status: dispute.returnRequest.status,
          trackingNumber: dispute.returnRequest.trackingNumber,
          carrier: dispute.returnRequest.carrier,
          shippedAt: dispute.returnRequest.shippedAt?.toISOString() ?? null,
          receivedAt: dispute.returnRequest.receivedAt?.toISOString() ?? null,
        }
      : null,
    orderTimelines: dispute.order.orderTimelines.map((item) => ({
      id: item.id,
      status: item.status,
      message: item.message,
      createdAt: item.createdAt.toISOString(),
    })),
    totalAmount: dispute.order.totalAmount,
    linkedDeliveryEvidence,
  };
}

async function getSnapshotSummary() {
  const statusRows = await prisma.dispute.groupBy({
    by: ["status"],
    _count: { _all: true },
  });

  const countsByStatus = new Map(
    statusRows.map((row) => [row.status, row._count._all]),
  );

  const totalDisputes = statusRows.reduce(
    (sum, row) => sum + row._count._all,
    0,
  );

  const openStatuses: DisputeStatus[] = [
    "OPEN",
    "UNDER_REVIEW",
    "WAITING_FOR_SELLER",
    "WAITING_FOR_CUSTOMER",
    "WAITING_FOR_RETURN",
  ];

  return {
    totalDisputes,
    openDisputes: openStatuses.reduce(
      (sum, status) => sum + (countsByStatus.get(status) ?? 0),
      0,
    ),
    pendingReviewDisputes: countsByStatus.get("OPEN") ?? 0,
    underReviewDisputes: countsByStatus.get("UNDER_REVIEW") ?? 0,
    waitingForSellerDisputes: countsByStatus.get("WAITING_FOR_SELLER") ?? 0,
    waitingForCustomerOrReturnDisputes:
      (countsByStatus.get("WAITING_FOR_CUSTOMER") ?? 0) +
      (countsByStatus.get("WAITING_FOR_RETURN") ?? 0),
  };
}

async function getRangeSummary(
  rangeStartDate: Date,
  rangeEndDate: Date,
): Promise<RangeSummary> {
  const [
    disputesCreated,
    resolvedDisputes,
    rejectedDisputes,
    refundTransactions,
  ] = await Promise.all([
    prisma.dispute.count({
      where: {
        createdAt: {
          gte: rangeStartDate,
          lte: rangeEndDate,
        },
      },
    }),
    prisma.dispute.count({
      where: {
        status: "RESOLVED",
        // updatedAt is the persisted terminal-state transition timestamp available on disputes.
        updatedAt: {
          gte: rangeStartDate,
          lte: rangeEndDate,
        },
      },
    }),
    prisma.dispute.count({
      where: {
        status: "REJECTED",
        // updatedAt is also the only persisted timestamp for rejection transitions.
        updatedAt: {
          gte: rangeStartDate,
          lte: rangeEndDate,
        },
      },
    }),
    prisma.transaction.findMany({
      where: {
        type: "REFUND",
        status: "SUCCESS",
        createdAt: {
          gte: rangeStartDate,
          lte: rangeEndDate,
        },
        reference: {
          startsWith: "dispute-refund-",
        },
      },
      select: {
        orderId: true,
        amount: true,
      },
    }),
  ]);

  return {
    disputesCreated,
    resolvedDisputes,
    rejectedDisputes,
    // Dispute.orderId is unique in the schema, so distinct refunded orderIds
    // map 1:1 to dispute cases for dispute-linked refund transactions.
    refundRecordedDisputes: new Set(
      refundTransactions.map((transaction) => transaction.orderId).filter(Boolean),
    ).size,
    refundRecordedAmount: refundTransactions.reduce(
      (sum, transaction) => sum + transaction.amount,
      0,
    ),
  };
}

async function getBucketedCreatedDisputes(range: AnalyticsDateRange) {
  const { rangeStartDate, rangeEndDate } = getRangeDates(range);
  const granularity = getAnalyticsBucketGranularity(range);

  const rows = await prisma.$queryRaw<BucketRow[]>(Prisma.sql`
    SELECT
      date_trunc(${granularity}, "createdAt") AS bucket,
      COUNT(*)::double precision AS value
    FROM "Dispute"
    WHERE "createdAt" >= ${rangeStartDate}
      AND "createdAt" <= ${rangeEndDate}
    GROUP BY bucket
    ORDER BY bucket ASC
  `);

  return buildTrendPoints(rows, granularity);
}

async function getBucketedResolvedDisputes(range: AnalyticsDateRange) {
  const { rangeStartDate, rangeEndDate } = getRangeDates(range);
  const granularity = getAnalyticsBucketGranularity(range);

  const rows = await prisma.$queryRaw<BucketRow[]>(Prisma.sql`
    SELECT
      date_trunc(${granularity}, "updatedAt") AS bucket,
      COUNT(*)::double precision AS value
    FROM "Dispute"
    WHERE "status" = 'RESOLVED'
      -- Disputes do not currently persist a dedicated resolvedAt timestamp.
      AND "updatedAt" >= ${rangeStartDate}
      AND "updatedAt" <= ${rangeEndDate}
    GROUP BY bucket
    ORDER BY bucket ASC
  `);

  return buildTrendPoints(rows, granularity);
}

async function getBucketedRefundRecordedDisputes(range: AnalyticsDateRange) {
  const { rangeStartDate, rangeEndDate } = getRangeDates(range);
  const granularity = getAnalyticsBucketGranularity(range);

  const rows = await prisma.$queryRaw<BucketRow[]>(Prisma.sql`
    SELECT
      date_trunc(${granularity}, "createdAt") AS bucket,
      COUNT(DISTINCT "orderId")::double precision AS value
    FROM "Transaction"
    WHERE "type" = 'REFUND'
      AND "status" = 'SUCCESS'
      AND "reference" LIKE 'dispute-refund-%'
      AND "createdAt" >= ${rangeStartDate}
      AND "createdAt" <= ${rangeEndDate}
    GROUP BY bucket
    ORDER BY bucket ASC
  `);

  return buildTrendPoints(rows, granularity);
}

async function getBreakdowns(range: AnalyticsDateRange) {
  const { rangeStartDate, rangeEndDate } = getRangeDates(range);

  const [reasonRows, statusRows, orderTypeRows, repeatStores, repeatCustomers] =
    await Promise.all([
      prisma.dispute.groupBy({
        by: ["reason"],
        _count: { _all: true },
        where: {
          createdAt: {
            gte: rangeStartDate,
            lte: rangeEndDate,
          },
        },
      }),
      prisma.dispute.groupBy({
        by: ["status"],
        _count: { _all: true },
      }),
      prisma.$queryRaw<Array<{ key: string; label: string; count: number }>>(Prisma.sql`
        SELECT
          CASE WHEN o."isFoodOrder" = true THEN 'FOOD' ELSE 'NON_FOOD' END AS key,
          CASE WHEN o."isFoodOrder" = true THEN 'Food orders' ELSE 'Non-food orders' END AS label,
          COUNT(*)::int AS count
        FROM "Dispute" d
        INNER JOIN "Order" o ON o.id = d."orderId"
        WHERE d."createdAt" >= ${rangeStartDate}
          AND d."createdAt" <= ${rangeEndDate}
        GROUP BY o."isFoodOrder"
        ORDER BY count DESC
      `),
      prisma.$queryRaw<Array<{ key: string; label: string; value: number; secondaryValue: number }>>(Prisma.sql`
        SELECT
          s.id AS key,
          s.name AS label,
          COUNT(DISTINCT d.id)::int AS value,
          COALESCE(SUM(COALESCE(d."refundAmount", 0)), 0)::double precision AS "secondaryValue"
        FROM "Dispute" d
        INNER JOIN "DisputeSellerGroupImpact" dsgi ON dsgi."disputeId" = d.id
        INNER JOIN "OrderSellerGroup" osg ON osg.id = dsgi."sellerGroupId"
        INNER JOIN "Store" s ON s.id = osg."storeId"
        WHERE d."createdAt" >= ${rangeStartDate}
          AND d."createdAt" <= ${rangeEndDate}
        GROUP BY s.id, s.name
        ORDER BY value DESC, "secondaryValue" DESC
        LIMIT 6
      `),
      prisma.$queryRaw<Array<{ key: string; label: string; value: number; secondaryValue: number }>>(Prisma.sql`
        SELECT
          u.id AS key,
          COALESCE(u.name, u.email) AS label,
          COUNT(d.id)::int AS value,
          COALESCE(SUM(COALESCE(d."refundAmount", 0)), 0)::double precision AS "secondaryValue"
        FROM "Dispute" d
        INNER JOIN "Order" o ON o.id = d."orderId"
        INNER JOIN "User" u ON u.id = o."userId"
        WHERE d."createdAt" >= ${rangeStartDate}
          AND d."createdAt" <= ${rangeEndDate}
        GROUP BY u.id, u.name, u.email
        ORDER BY value DESC, "secondaryValue" DESC
        LIMIT 6
      `),
    ]);

  return {
    disputesByReason: reasonRows.map((row) => ({
      key: row.reason,
      label: row.reason.replaceAll("_", " ").toLowerCase().replace(/\b\w/g, (part) => part.toUpperCase()),
      count: row._count._all,
    })),
    disputesByStatus: statusRows.map((row) => ({
      key: row.status,
      label: row.status.replaceAll("_", " ").toLowerCase().replace(/\b\w/g, (part) => part.toUpperCase()),
      count: row._count._all,
    })),
    disputesByOrderType: orderTypeRows.map((row) => ({
      key: row.key,
      label: row.label,
      count: row.count,
    })),
    repeatStores,
    repeatCustomers,
  };
}

async function getUrgentCases() {
  const disputes = await prisma.dispute.findMany({
    where: {
      status: {
        in: [
          "OPEN",
          "UNDER_REVIEW",
          "WAITING_FOR_SELLER",
          "WAITING_FOR_CUSTOMER",
          "WAITING_FOR_RETURN",
        ],
      },
    },
    orderBy: { createdAt: "asc" },
    include: adminDisputeInclude,
    take: 6,
  });

  return disputes.map(mapDisputeToAdminDetail);
}

async function getCasesForRange(range: AnalyticsDateRange) {
  const { rangeStartDate, rangeEndDate } = getRangeDates(range);

  const disputes = await prisma.dispute.findMany({
    where: {
      createdAt: {
        gte: rangeStartDate,
        lte: rangeEndDate,
      },
    },
    orderBy: { createdAt: "desc" },
    include: adminDisputeInclude,
  });

  return disputes.map(mapDisputeToAdminDetail);
}

export async function getAdminDisputeById(disputeId: string) {
  const dispute = await prisma.dispute.findUnique({
    where: { id: disputeId },
    include: adminDisputeInclude,
  });

  if (!dispute) {
    return null;
  }

  return mapDisputeToAdminDetail(dispute);
}

export async function getAdminDisputesDashboard(
  range: AnalyticsDateRange,
): Promise<AdminDisputesDashboardResponse> {
  const previousRange = getPreviousAnalyticsDateRange(range);
  const { rangeStartDate: previousRangeStartDate, rangeEndDate: previousRangeEndDate } =
    getRangeDates(previousRange);

  const [
    snapshot,
    rangeSummary,
    previousRangeSummary,
    disputesCreatedTrend,
    resolvedDisputesTrend,
    refundRecordedDisputesTrend,
    breakdowns,
    urgentCases,
    cases,
  ] = await Promise.all([
    getSnapshotSummary(),
    getRangeSummary(new Date(range.startDate), new Date(range.endDate)),
    getRangeSummary(previousRangeStartDate, previousRangeEndDate),
    getBucketedCreatedDisputes(range),
    getBucketedResolvedDisputes(range),
    getBucketedRefundRecordedDisputes(range),
    getBreakdowns(range),
    getUrgentCases(),
    getCasesForRange(range),
  ]);

  return {
    range,
    snapshot,
    rangeSummary,
    changes: {
      disputesCreated: calculateChange(
        rangeSummary.disputesCreated,
        previousRangeSummary.disputesCreated,
      ),
      resolvedDisputes: calculateChange(
        rangeSummary.resolvedDisputes,
        previousRangeSummary.resolvedDisputes,
      ),
      rejectedDisputes: calculateChange(
        rangeSummary.rejectedDisputes,
        previousRangeSummary.rejectedDisputes,
      ),
      refundRecordedDisputes: calculateChange(
        rangeSummary.refundRecordedDisputes,
        previousRangeSummary.refundRecordedDisputes,
      ),
      refundRecordedAmount: calculateChange(
        rangeSummary.refundRecordedAmount,
        previousRangeSummary.refundRecordedAmount,
      ),
    },
    trends: {
      disputesCreated: disputesCreatedTrend,
      resolvedDisputes: resolvedDisputesTrend,
      refundRecordedDisputes: refundRecordedDisputesTrend,
    },
    breakdowns,
    urgentCases,
    cases,
  };
}
