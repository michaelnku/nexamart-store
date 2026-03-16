import { Prisma } from "@/generated/prisma";

import {
  AnalyticsDateRange,
  getAnalyticsBucketGranularity,
  getPreviousAnalyticsDateRange,
} from "@/lib/analytics/date-range";
import { calculateChange } from "@/lib/analytics/format";
import { prisma } from "@/lib/prisma";

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

type ValueBreakdown = {
  key: string;
  label: string;
  value: number;
  secondaryValue?: number;
};

type SellerQueueRow = {
  key: string;
  sellerLabel: string;
  awaitingOrdersCount: number;
  pendingAmount: number;
  releasedAmount: number;
  lastReleaseDate: string | null;
  payoutStatusSummary: string;
};

type RiderQueueRow = {
  key: string;
  riderLabel: string;
  awaitingDeliveriesCount: number;
  pendingAmount: number;
  releasedAmount: number;
  lastReleaseDate: string | null;
};

type ReleasedPayoutHistoryRow = {
  key: string;
  entityType: "SELLER" | "RIDER";
  entityLabel: string;
  amount: number;
  sourceReference: string;
  releasedAt: string;
};

type EscrowExposureSummaryRow = {
  key: string;
  label: string;
  heldAmount: number;
  entriesCount: number;
  lastActivityAt: string | null;
};

export type EscrowPayoutControlResponse = {
  range: AnalyticsDateRange;
  snapshot: {
    totalPendingPayoutLiability: number;
    pendingSellerPayouts: number;
    pendingRiderPayouts: number;
    escrowHeldCommission: number;
    ordersAwaitingPayoutRelease: number;
    deliveriesAwaitingPayoutRelease: number;
    sellersWithPendingPayouts: number;
    ridersWithPendingPayouts: number;
  };
  rangeSummary: {
    releasedSellerPayouts: number;
    releasedRiderPayouts: number;
    totalReleasedPayouts: number;
  };
  changes: {
    totalReleasedPayouts: number | null;
    releasedSellerPayouts: number | null;
    releasedRiderPayouts: number | null;
  };
  trends: {
    releasedSellerPayouts: TrendPoint[];
    releasedRiderPayouts: TrendPoint[];
    totalReleasedPayouts: TrendPoint[];
  };
  breakdowns: {
    payoutsByStatus: CountBreakdown[];
    sellerPayoutExposure: ValueBreakdown[];
    riderPayoutExposure: ValueBreakdown[];
    topSellersByReleasedPayout: ValueBreakdown[];
    topRidersByReleasedPayout: ValueBreakdown[];
    longestWaitingSellers: ValueBreakdown[];
    longestWaitingRiders: ValueBreakdown[];
  };
  tables: {
    sellerPayoutQueue: SellerQueueRow[];
    riderPayoutQueue: RiderQueueRow[];
    releasedPayoutHistory: ReleasedPayoutHistoryRow[];
    escrowExposureSummary: EscrowExposureSummaryRow[];
  };
};

function startAndEnd(range: Pick<AnalyticsDateRange, "startDate" | "endDate">) {
  return {
    startDate: new Date(range.startDate),
    endDate: new Date(range.endDate),
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

function labelEnumValue(value: string | null | undefined) {
  if (!value) {
    return "Unknown";
  }

  return value
    .toLowerCase()
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function mergeTrendPoints(first: TrendPoint[], second: TrendPoint[]) {
  const map = new Map<string, { label: string; value: number }>();

  for (const item of first) {
    map.set(item.bucket, { label: item.label, value: item.value });
  }

  for (const item of second) {
    const existing = map.get(item.bucket);
    map.set(item.bucket, {
      label: existing?.label ?? item.label,
      value: (existing?.value ?? 0) + item.value,
    });
  }

  return Array.from(map.entries())
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([bucket, value]) => ({
      bucket,
      label: value.label,
      value: value.value,
    }));
}

async function getSnapshotSummary(snapshotAsOfDate: Date) {
  const [
    sellerPendingAggregate,
    riderPendingAggregate,
    heldCommissionRows,
    ordersAwaitingPayoutRelease,
    deliveriesAwaitingPayoutRelease,
    sellersWithPendingRows,
    ridersWithPendingRows,
  ] = await Promise.all([
    prisma.orderSellerGroup.aggregate({
      where: {
        sellerRevenue: { gt: 0 },
        payoutReleasedAt: null,
        payoutStatus: { notIn: ["COMPLETED", "CANCELLED"] },
        order: {
          isPaid: true,
          status: { in: ["DELIVERED", "DISPUTED"] },
        },
      },
      _sum: { sellerRevenue: true },
    }),
    prisma.delivery.aggregate({
      where: {
        riderPayoutAmount: { gt: 0 },
        payoutReleasedAt: null,
        status: "DELIVERED",
        order: {
          isPaid: true,
        },
      },
      _sum: { riderPayoutAmount: true },
    }),
    prisma.$queryRaw<Array<{ value: number }>>(Prisma.sql`
      SELECT
        -- HELD commission entries may be partially drawn down, so exposure is the remaining held balance.
        COALESCE(SUM("amount" - COALESCE("withdrawnAmount", 0)), 0)::double precision AS value
      FROM "EscrowLedger"
      WHERE "role" = 'PLATFORM'
        AND "entryType" = 'PLATFORM_COMMISSION'
        AND "status" = 'HELD'
    `),
    prisma.order.count({
      where: {
        isPaid: true,
        status: { in: ["DELIVERED", "DISPUTED"] },
        payoutReleased: false,
        createdAt: { lte: snapshotAsOfDate },
      },
    }),
    prisma.delivery.count({
      where: {
        riderPayoutAmount: { gt: 0 },
        payoutReleasedAt: null,
        status: "DELIVERED",
        order: { isPaid: true },
        deliveredAt: { lte: snapshotAsOfDate },
      },
    }),
    prisma.$queryRaw<Array<{ sellerId: string }>>(Prisma.sql`
      SELECT DISTINCT "sellerId"
      FROM "OrderSellerGroup" osg
      INNER JOIN "Order" o ON o.id = osg."orderId"
      WHERE osg."sellerRevenue" > 0
        AND osg."payoutReleasedAt" IS NULL
        AND osg."payoutStatus" NOT IN ('COMPLETED', 'CANCELLED')
        AND o."isPaid" = true
        AND o."status" IN ('DELIVERED', 'DISPUTED')
    `),
    prisma.$queryRaw<Array<{ riderId: string }>>(Prisma.sql`
      SELECT DISTINCT d."riderId"
      FROM "Delivery" d
      INNER JOIN "Order" o ON o.id = d."orderId"
      WHERE d."riderId" IS NOT NULL
        AND d."riderPayoutAmount" > 0
        AND d."payoutReleasedAt" IS NULL
        AND d."status" = 'DELIVERED'
        AND o."isPaid" = true
    `),
  ]);

  const pendingSellerPayouts = sellerPendingAggregate._sum.sellerRevenue ?? 0;
  const pendingRiderPayouts = riderPendingAggregate._sum.riderPayoutAmount ?? 0;

  return {
    totalPendingPayoutLiability: pendingSellerPayouts + pendingRiderPayouts,
    pendingSellerPayouts,
    pendingRiderPayouts,
    escrowHeldCommission: heldCommissionRows[0]?.value ?? 0,
    ordersAwaitingPayoutRelease,
    deliveriesAwaitingPayoutRelease,
    sellersWithPendingPayouts: sellersWithPendingRows.length,
    ridersWithPendingPayouts: ridersWithPendingRows.length,
  };
}

async function getRangeSummary(rangeStartDate: Date, rangeEndDate: Date) {
  const [sellerReleasedAggregate, riderReleasedAggregate] = await Promise.all([
    prisma.orderSellerGroup.aggregate({
      where: {
        payoutStatus: "COMPLETED",
        payoutReleasedAt: {
          not: null,
          gte: rangeStartDate,
          lte: rangeEndDate,
        },
      },
      _sum: { sellerRevenue: true },
    }),
    prisma.delivery.aggregate({
      where: {
        // Delivery.payoutReleasedAt is the persisted rider payout release marker.
        payoutReleasedAt: {
          not: null,
          gte: rangeStartDate,
          lte: rangeEndDate,
        },
      },
      _sum: { riderPayoutAmount: true },
    }),
  ]);

  const releasedSellerPayouts = sellerReleasedAggregate._sum.sellerRevenue ?? 0;
  const releasedRiderPayouts =
    riderReleasedAggregate._sum.riderPayoutAmount ?? 0;

  return {
    releasedSellerPayouts,
    releasedRiderPayouts,
    totalReleasedPayouts: releasedSellerPayouts + releasedRiderPayouts,
  };
}

async function getBucketedSellerPayouts(range: AnalyticsDateRange) {
  const { startDate, endDate } = startAndEnd(range);
  const granularity = getAnalyticsBucketGranularity(range);

  const rows = await prisma.$queryRaw<BucketRow[]>(Prisma.sql`
    SELECT
      date_trunc(${granularity}, "payoutReleasedAt") AS bucket,
      COALESCE(SUM("sellerRevenue"), 0)::double precision AS value
    FROM "OrderSellerGroup"
    WHERE "payoutStatus" = 'COMPLETED'
      AND "payoutReleasedAt" IS NOT NULL
      AND "payoutReleasedAt" >= ${startDate}
      AND "payoutReleasedAt" <= ${endDate}
    GROUP BY bucket
    ORDER BY bucket ASC
  `);

  return buildTrendPoints(rows, granularity);
}

async function getBucketedRiderPayouts(range: AnalyticsDateRange) {
  const { startDate, endDate } = startAndEnd(range);
  const granularity = getAnalyticsBucketGranularity(range);

  const rows = await prisma.$queryRaw<BucketRow[]>(Prisma.sql`
    SELECT
      date_trunc(${granularity}, "payoutReleasedAt") AS bucket,
      COALESCE(SUM("riderPayoutAmount"), 0)::double precision AS value
    FROM "Delivery"
    WHERE "payoutReleasedAt" IS NOT NULL
      AND "payoutReleasedAt" >= ${startDate}
      AND "payoutReleasedAt" <= ${endDate}
    GROUP BY bucket
    ORDER BY bucket ASC
  `);

  return buildTrendPoints(rows, granularity);
}

async function getBreakdowns(
  snapshotAsOfDate: Date,
  selectedRange: AnalyticsDateRange,
) {
  const { startDate: selectedRangeStartDate, endDate: selectedRangeEndDate } =
    startAndEnd(selectedRange);

  const [
    sellerStatusRows,
    riderCompletedCount,
    sellerExposure,
    riderExposure,
    topReleasedSellers,
    topReleasedRiders,
    longestWaitingSellers,
    longestWaitingRiders,
  ] = await Promise.all([
    prisma.orderSellerGroup.groupBy({
      by: ["payoutStatus"],
      _count: { _all: true },
      where: {
        order: {
          createdAt: {
            lte: snapshotAsOfDate,
          },
        },
      },
    }),
    prisma.delivery.count({
      where: {
        payoutReleasedAt: {
          not: null,
          lte: snapshotAsOfDate,
        },
      },
    }),
    prisma.$queryRaw<ValueBreakdown[]>(Prisma.sql`
      SELECT
        u.id AS key,
        COALESCE(s.name, u.name, u.email) AS label,
        COALESCE(SUM(osg."sellerRevenue"), 0)::double precision AS value,
        COUNT(DISTINCT osg."orderId")::double precision AS "secondaryValue"
      FROM "OrderSellerGroup" osg
      INNER JOIN "Order" o ON o.id = osg."orderId"
      INNER JOIN "User" u ON u.id = osg."sellerId"
      LEFT JOIN "Store" s ON s."userId" = u.id
      WHERE osg."sellerRevenue" > 0
        AND osg."payoutReleasedAt" IS NULL
        AND osg."payoutStatus" NOT IN ('COMPLETED', 'CANCELLED')
        AND o."isPaid" = true
        AND o."status" IN ('DELIVERED', 'DISPUTED')
      GROUP BY u.id, s.name, u.name, u.email
      ORDER BY value DESC
      LIMIT 8
    `),
    prisma.$queryRaw<ValueBreakdown[]>(Prisma.sql`
      SELECT
        u.id AS key,
        COALESCE(u.name, u.email) AS label,
        COALESCE(SUM(d."riderPayoutAmount"), 0)::double precision AS value,
        COUNT(*)::double precision AS "secondaryValue"
      FROM "Delivery" d
      INNER JOIN "Order" o ON o.id = d."orderId"
      INNER JOIN "User" u ON u.id = d."riderId"
      WHERE d."riderId" IS NOT NULL
        AND d."riderPayoutAmount" > 0
        AND d."payoutReleasedAt" IS NULL
        AND d."status" = 'DELIVERED'
        AND o."isPaid" = true
      GROUP BY u.id, u.name, u.email
      ORDER BY value DESC
      LIMIT 8
    `),
    prisma.$queryRaw<ValueBreakdown[]>(Prisma.sql`
      SELECT
        u.id AS key,
        COALESCE(s.name, u.name, u.email) AS label,
        COALESCE(SUM(osg."sellerRevenue"), 0)::double precision AS value,
        COUNT(DISTINCT osg."orderId")::double precision AS "secondaryValue"
      FROM "OrderSellerGroup" osg
      INNER JOIN "User" u ON u.id = osg."sellerId"
      LEFT JOIN "Store" s ON s."userId" = u.id
      WHERE osg."payoutStatus" = 'COMPLETED'
        AND osg."payoutReleasedAt" IS NOT NULL
        AND osg."payoutReleasedAt" >= ${selectedRangeStartDate}
        AND osg."payoutReleasedAt" <= ${selectedRangeEndDate}
      GROUP BY u.id, s.name, u.name, u.email
      ORDER BY value DESC
      LIMIT 8
    `),
    prisma.$queryRaw<ValueBreakdown[]>(Prisma.sql`
      SELECT
        u.id AS key,
        COALESCE(u.name, u.email) AS label,
        COALESCE(SUM(d."riderPayoutAmount"), 0)::double precision AS value,
        COUNT(*)::double precision AS "secondaryValue"
      FROM "Delivery" d
      INNER JOIN "User" u ON u.id = d."riderId"
      WHERE d."riderId" IS NOT NULL
        AND d."payoutReleasedAt" IS NOT NULL
        AND d."payoutReleasedAt" >= ${selectedRangeStartDate}
        AND d."payoutReleasedAt" <= ${selectedRangeEndDate}
      GROUP BY u.id, u.name, u.email
      ORDER BY value DESC
      LIMIT 8
    `),
    prisma.$queryRaw<ValueBreakdown[]>(Prisma.sql`
      SELECT
        u.id AS key,
        COALESCE(s.name, u.name, u.email) AS label,
        EXTRACT(EPOCH FROM (${snapshotAsOfDate} - MIN(COALESCE(osg."payoutEligibleAt", d."deliveredAt", osg."createdAt")))) / 86400.0 AS value,
        COALESCE(SUM(osg."sellerRevenue"), 0)::double precision AS "secondaryValue"
      FROM "OrderSellerGroup" osg
      INNER JOIN "Order" o ON o.id = osg."orderId"
      INNER JOIN "User" u ON u.id = osg."sellerId"
      LEFT JOIN "Store" s ON s."userId" = u.id
      LEFT JOIN "Delivery" d ON d."orderId" = o.id
      WHERE osg."sellerRevenue" > 0
        AND osg."payoutReleasedAt" IS NULL
        AND osg."payoutStatus" NOT IN ('COMPLETED', 'CANCELLED')
        AND o."isPaid" = true
        AND o."status" IN ('DELIVERED', 'DISPUTED')
      GROUP BY u.id, s.name, u.name, u.email
      ORDER BY value DESC
      LIMIT 8
    `),
    prisma.$queryRaw<ValueBreakdown[]>(Prisma.sql`
      SELECT
        u.id AS key,
        COALESCE(u.name, u.email) AS label,
        EXTRACT(EPOCH FROM (${snapshotAsOfDate} - MIN(COALESCE(d."payoutEligibleAt", d."deliveredAt", d."assignedAt")))) / 86400.0 AS value,
        COALESCE(SUM(d."riderPayoutAmount"), 0)::double precision AS "secondaryValue"
      FROM "Delivery" d
      INNER JOIN "Order" o ON o.id = d."orderId"
      INNER JOIN "User" u ON u.id = d."riderId"
      WHERE d."riderId" IS NOT NULL
        AND d."riderPayoutAmount" > 0
        AND d."payoutReleasedAt" IS NULL
        AND d."status" = 'DELIVERED'
        AND o."isPaid" = true
      GROUP BY u.id, u.name, u.email
      ORDER BY value DESC
      LIMIT 8
    `),
  ]);

  const riderPendingCount = await prisma.delivery.count({
    where: {
      riderPayoutAmount: { gt: 0 },
      payoutReleasedAt: null,
      status: "DELIVERED",
      order: { isPaid: true },
    },
  });

  return {
    payoutsByStatus: [
      ...sellerStatusRows.map((row) => ({
        key: row.payoutStatus,
        label: `Seller ${labelEnumValue(row.payoutStatus)}`,
        count: row._count._all,
      })),
      {
        key: "RIDER_PENDING",
        label: "Rider Pending",
        count: riderPendingCount,
      },
      {
        key: "RIDER_COMPLETED",
        label: "Rider Completed",
        count: riderCompletedCount,
      },
    ],
    sellerPayoutExposure: sellerExposure,
    riderPayoutExposure: riderExposure,
    topSellersByReleasedPayout: topReleasedSellers,
    topRidersByReleasedPayout: topReleasedRiders,
    longestWaitingSellers,
    longestWaitingRiders,
  };
}

async function getSellerQueue(range: AnalyticsDateRange) {
  const { startDate, endDate } = startAndEnd(range);

  const rows = await prisma.$queryRaw<
    Array<{
      key: string;
      sellerLabel: string;
      awaitingOrdersCount: number;
      pendingAmount: number;
      releasedAmount: number;
      lastReleaseDate: Date | null;
      pendingGroups: number;
      completedGroups: number;
      cancelledGroups: number;
    }>
  >(Prisma.sql`
    SELECT
      u.id AS key,
      COALESCE(s.name, u.name, u.email) AS "sellerLabel",
      COUNT(DISTINCT CASE
        WHEN osg."sellerRevenue" > 0
         AND osg."payoutReleasedAt" IS NULL
         AND osg."payoutStatus" NOT IN ('COMPLETED', 'CANCELLED')
         AND o."isPaid" = true
         AND o."status" IN ('DELIVERED', 'DISPUTED')
        THEN osg."orderId"
      END)::double precision AS "awaitingOrdersCount",
      COALESCE(SUM(CASE
        WHEN osg."sellerRevenue" > 0
         AND osg."payoutReleasedAt" IS NULL
         AND osg."payoutStatus" NOT IN ('COMPLETED', 'CANCELLED')
         AND o."isPaid" = true
         AND o."status" IN ('DELIVERED', 'DISPUTED')
        THEN osg."sellerRevenue"
        ELSE 0
      END), 0)::double precision AS "pendingAmount",
      COALESCE(SUM(CASE
        WHEN osg."payoutStatus" = 'COMPLETED'
         AND osg."payoutReleasedAt" IS NOT NULL
         AND osg."payoutReleasedAt" >= ${startDate}
         AND osg."payoutReleasedAt" <= ${endDate}
        THEN osg."sellerRevenue"
        ELSE 0
      END), 0)::double precision AS "releasedAmount",
      MAX(osg."payoutReleasedAt") AS "lastReleaseDate",
      COUNT(CASE WHEN osg."payoutStatus" = 'PENDING' THEN 1 END)::double precision AS "pendingGroups",
      COUNT(CASE WHEN osg."payoutStatus" = 'COMPLETED' THEN 1 END)::double precision AS "completedGroups",
      COUNT(CASE WHEN osg."payoutStatus" = 'CANCELLED' THEN 1 END)::double precision AS "cancelledGroups"
    FROM "OrderSellerGroup" osg
    INNER JOIN "Order" o ON o.id = osg."orderId"
    INNER JOIN "User" u ON u.id = osg."sellerId"
    LEFT JOIN "Store" s ON s."userId" = u.id
    GROUP BY u.id, s.name, u.name, u.email
    HAVING
      COALESCE(SUM(CASE
        WHEN osg."sellerRevenue" > 0
         AND osg."payoutReleasedAt" IS NULL
         AND osg."payoutStatus" NOT IN ('COMPLETED', 'CANCELLED')
         AND o."isPaid" = true
         AND o."status" IN ('DELIVERED', 'DISPUTED')
        THEN osg."sellerRevenue"
        ELSE 0
      END), 0) > 0
      OR COALESCE(SUM(CASE
        WHEN osg."payoutStatus" = 'COMPLETED'
         AND osg."payoutReleasedAt" IS NOT NULL
         AND osg."payoutReleasedAt" >= ${startDate}
         AND osg."payoutReleasedAt" <= ${endDate}
        THEN osg."sellerRevenue"
        ELSE 0
      END), 0) > 0
    ORDER BY "pendingAmount" DESC, "releasedAmount" DESC
    LIMIT 16
  `);

  return rows.map((row) => ({
    key: row.key,
    sellerLabel: row.sellerLabel,
    awaitingOrdersCount: row.awaitingOrdersCount,
    pendingAmount: row.pendingAmount,
    releasedAmount: row.releasedAmount,
    lastReleaseDate: row.lastReleaseDate?.toISOString() ?? null,
    payoutStatusSummary: `${row.pendingGroups} pending / ${row.completedGroups} completed / ${row.cancelledGroups} cancelled`,
  }));
}

async function getRiderQueue(range: AnalyticsDateRange) {
  const { startDate, endDate } = startAndEnd(range);

  const rows = await prisma.$queryRaw<
    Array<{
      key: string;
      riderLabel: string;
      awaitingDeliveriesCount: number;
      pendingAmount: number;
      releasedAmount: number;
      lastReleaseDate: Date | null;
    }>
  >(Prisma.sql`
    SELECT
      u.id AS key,
      COALESCE(u.name, u.email) AS "riderLabel",
      COUNT(CASE
        WHEN d."riderPayoutAmount" > 0
         AND d."payoutReleasedAt" IS NULL
         AND d."status" = 'DELIVERED'
         AND o."isPaid" = true
        THEN 1
      END)::double precision AS "awaitingDeliveriesCount",
      COALESCE(SUM(CASE
        WHEN d."riderPayoutAmount" > 0
         AND d."payoutReleasedAt" IS NULL
         AND d."status" = 'DELIVERED'
         AND o."isPaid" = true
        THEN d."riderPayoutAmount"
        ELSE 0
      END), 0)::double precision AS "pendingAmount",
      COALESCE(SUM(CASE
        WHEN d."payoutReleasedAt" IS NOT NULL
         AND d."payoutReleasedAt" >= ${startDate}
         AND d."payoutReleasedAt" <= ${endDate}
        THEN d."riderPayoutAmount"
        ELSE 0
      END), 0)::double precision AS "releasedAmount",
      MAX(d."payoutReleasedAt") AS "lastReleaseDate"
    FROM "Delivery" d
    INNER JOIN "Order" o ON o.id = d."orderId"
    INNER JOIN "User" u ON u.id = d."riderId"
    WHERE d."riderId" IS NOT NULL
    GROUP BY u.id, u.name, u.email
    HAVING
      COUNT(CASE
        WHEN d."riderPayoutAmount" > 0
         AND d."payoutReleasedAt" IS NULL
         AND d."status" = 'DELIVERED'
         AND o."isPaid" = true
        THEN 1
      END) > 0
      OR COALESCE(SUM(CASE
        WHEN d."payoutReleasedAt" IS NOT NULL
         AND d."payoutReleasedAt" >= ${startDate}
         AND d."payoutReleasedAt" <= ${endDate}
        THEN d."riderPayoutAmount"
        ELSE 0
      END), 0) > 0
    ORDER BY "pendingAmount" DESC, "releasedAmount" DESC
    LIMIT 16
  `);

  return rows.map((row) => ({
    key: row.key,
    riderLabel: row.riderLabel,
    awaitingDeliveriesCount: row.awaitingDeliveriesCount,
    pendingAmount: row.pendingAmount,
    releasedAmount: row.releasedAmount,
    lastReleaseDate: row.lastReleaseDate?.toISOString() ?? null,
  }));
}

async function getReleasedPayoutHistory(range: AnalyticsDateRange) {
  const { startDate, endDate } = startAndEnd(range);

  const [sellerRows, riderRows] = await Promise.all([
    prisma.$queryRaw<
      Array<Omit<ReleasedPayoutHistoryRow, "entityType"> & { releasedAt: Date }>
    >(Prisma.sql`
      SELECT
        osg.id AS key,
        COALESCE(s.name, u.name, u.email) AS "entityLabel",
        osg."sellerRevenue"::double precision AS amount,
        COALESCE(osg."internalTrackingNumber", osg.id) AS "sourceReference",
        osg."payoutReleasedAt" AS "releasedAt"
      FROM "OrderSellerGroup" osg
      INNER JOIN "User" u ON u.id = osg."sellerId"
      LEFT JOIN "Store" s ON s."userId" = u.id
      WHERE osg."payoutStatus" = 'COMPLETED'
        AND osg."payoutReleasedAt" IS NOT NULL
        AND osg."payoutReleasedAt" >= ${startDate}
        AND osg."payoutReleasedAt" <= ${endDate}
      ORDER BY osg."payoutReleasedAt" DESC
      LIMIT 20
    `),
    prisma.$queryRaw<
      Array<Omit<ReleasedPayoutHistoryRow, "entityType"> & { releasedAt: Date }>
    >(Prisma.sql`
      SELECT
        d.id AS key,
        COALESCE(u.name, u.email) AS "entityLabel",
        d."riderPayoutAmount"::double precision AS amount,
        COALESCE(o."trackingNumber", d."orderId") AS "sourceReference",
        d."payoutReleasedAt" AS "releasedAt"
      FROM "Delivery" d
      INNER JOIN "User" u ON u.id = d."riderId"
      INNER JOIN "Order" o ON o.id = d."orderId"
      WHERE d."riderId" IS NOT NULL
        -- Rider payouts do not have a separate payout status enum; release is recorded by payoutReleasedAt.
        AND d."payoutReleasedAt" IS NOT NULL
        AND d."payoutReleasedAt" >= ${startDate}
        AND d."payoutReleasedAt" <= ${endDate}
      ORDER BY d."payoutReleasedAt" DESC
      LIMIT 20
    `),
  ]);

  return [
    ...sellerRows.map((row) => ({
      ...row,
      entityType: "SELLER" as const,
      releasedAt: row.releasedAt.toISOString(),
    })),
    ...riderRows.map((row) => ({
      ...row,
      entityType: "RIDER" as const,
      releasedAt: row.releasedAt.toISOString(),
    })),
  ]
    .sort((left, right) => right.releasedAt.localeCompare(left.releasedAt))
    .slice(0, 24);
}

async function getEscrowExposureSummary() {
  const rows = await prisma.$queryRaw<
    Array<{
      key: string;
      label: string;
      heldAmount: number;
      entriesCount: number;
      lastActivityAt: Date | null;
    }>
  >(Prisma.sql`
    SELECT
      CONCAT("role"::text, '-', "entryType"::text) AS key,
      CONCAT(
        INITCAP(REPLACE("role"::text, '_', ' ')),
        ' ',
        INITCAP(REPLACE("entryType"::text, '_', ' '))
      ) AS label,
      -- HELD rows can be partially drawn down; the unreleased exposure is the remaining held amount.
      COALESCE(SUM("amount" - COALESCE("withdrawnAmount", 0)), 0)::double precision AS "heldAmount",
      COUNT(*)::double precision AS "entriesCount",
      MAX("updatedAt") AS "lastActivityAt"
    FROM "EscrowLedger"
    WHERE "status" = 'HELD'
      AND "entryType" IN ('SELLER_EARNING', 'RIDER_EARNING', 'PLATFORM_COMMISSION')
    GROUP BY "role", "entryType"
    ORDER BY "heldAmount" DESC
  `);

  return rows.map((row) => ({
    ...row,
    lastActivityAt: row.lastActivityAt?.toISOString() ?? null,
  }));
}

export async function getAdminEscrowPayoutControl(
  range: AnalyticsDateRange,
): Promise<EscrowPayoutControlResponse> {
  const currentSnapshotAt = new Date();
  const previousRange = getPreviousAnalyticsDateRange(range);
  const previousStartDate = new Date(previousRange.startDate);
  const previousEndDate = new Date(previousRange.endDate);

  const [
    snapshot,
    rangeSummary,
    previousRangeSummary,
    sellerTrend,
    riderTrend,
    breakdowns,
    sellerQueue,
    riderQueue,
    releasedHistory,
    escrowExposureSummary,
  ] = await Promise.all([
    getSnapshotSummary(currentSnapshotAt),
    getRangeSummary(new Date(range.startDate), new Date(range.endDate)),
    getRangeSummary(previousStartDate, previousEndDate),
    getBucketedSellerPayouts(range),
    getBucketedRiderPayouts(range),
    getBreakdowns(currentSnapshotAt, range),
    getSellerQueue(range),
    getRiderQueue(range),
    getReleasedPayoutHistory(range),
    getEscrowExposureSummary(),
  ]);

  return {
    range,
    snapshot,
    rangeSummary,
    changes: {
      totalReleasedPayouts: calculateChange(
        rangeSummary.totalReleasedPayouts,
        previousRangeSummary.totalReleasedPayouts,
      ),
      releasedSellerPayouts: calculateChange(
        rangeSummary.releasedSellerPayouts,
        previousRangeSummary.releasedSellerPayouts,
      ),
      releasedRiderPayouts: calculateChange(
        rangeSummary.releasedRiderPayouts,
        previousRangeSummary.releasedRiderPayouts,
      ),
    },
    trends: {
      releasedSellerPayouts: sellerTrend,
      releasedRiderPayouts: riderTrend,
      totalReleasedPayouts: mergeTrendPoints(sellerTrend, riderTrend),
    },
    breakdowns,
    tables: {
      sellerPayoutQueue: sellerQueue,
      riderPayoutQueue: riderQueue,
      releasedPayoutHistory: releasedHistory,
      escrowExposureSummary,
    },
  };
}
