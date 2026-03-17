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

type CountRow = {
  key: string | null;
  value: number;
};

type BreakdownRow = {
  key: string;
  label: string;
  value: number;
};

type ValueBreakdown = {
  key: string;
  label: string;
  value: number;
  secondaryValue?: number;
};

type SellerPayoutReportRow = {
  key: string;
  sellerLabel: string;
  ordersCount: number;
  sellerRevenueInRange: number;
  pendingPayout: number;
  releasedPayout: number;
  lastPayoutDate: string | null;
};

type RiderPayoutReportRow = {
  key: string;
  riderLabel: string;
  deliveriesCount: number;
  pendingPayout: number;
  releasedPayout: number;
  lastPayoutDate: string | null;
};

type PlatformRevenueReportRow = {
  key: string;
  sellerLabel: string;
  gmvContribution: number;
  platformCommissionContribution: number;
  ordersCount: number;
};

type RefundReportRow = {
  key: string;
  orderReference: string;
  customerLabel: string;
  amount: number;
  status: string;
  createdAt: string;
};

export type RevenueReportsResponse = {
  range: AnalyticsDateRange;
  summary: {
    grossRevenue: number;
    platformCommissionRecognized: number;
    sellerPayoutsReleased: number;
    riderPayoutsReleased: number;
    totalPayoutsReleased: number;
    pendingSellerPayouts: number;
    pendingRiderPayouts: number;
    pendingTotalPayoutLiability: number;
    refundsInRange: number;
    netPlatformRetainedRevenue: number;
    averageOrderValue: number;
    ordersCount: number;
  };
  changes: {
    grossRevenue: number | null;
    platformCommissionRecognized: number | null;
    totalPayoutsReleased: number | null;
    refundsInRange: number | null;
    netPlatformRetainedRevenue: number | null;
    averageOrderValue: number | null;
  };
  trends: {
    grossRevenue: TrendPoint[];
    platformCommission: TrendPoint[];
    sellerPayouts: TrendPoint[];
    riderPayouts: TrendPoint[];
    refunds: TrendPoint[];
    netRetainedRevenue: TrendPoint[];
  };
  breakdowns: {
    revenueByPaymentMethod: BreakdownRow[];
    revenueByDeliveryType: BreakdownRow[];
    topEarningSellers: ValueBreakdown[];
    topPlatformContributors: ValueBreakdown[];
    sellerPayoutExposure: ValueBreakdown[];
    riderPayoutExposure: ValueBreakdown[];
  };
  reports: {
    sellerPayouts: SellerPayoutReportRow[];
    riderPayouts: RiderPayoutReportRow[];
    platformRevenue: PlatformRevenueReportRow[];
    refunds: RefundReportRow[];
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

function mergeTrendPoints(
  base: TrendPoint[],
  adjustment: TrendPoint[],
  combine: (baseValue: number, adjustmentValue: number) => number,
) {
  const buckets = new Map<string, { label: string; value: number }>();

  for (const point of base) {
    buckets.set(point.bucket, {
      label: point.label,
      value: point.value,
    });
  }

  for (const point of adjustment) {
    const existing = buckets.get(point.bucket);
    buckets.set(point.bucket, {
      label: existing?.label ?? point.label,
      value: combine(existing?.value ?? 0, point.value),
    });
  }

  return Array.from(buckets.entries())
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([bucket, entry]) => ({
      bucket,
      label: entry.label,
      value: entry.value,
    }));
}

async function getRevenueSummary(startDate: Date, endDate: Date) {
  const [
    orderAggregate,
    platformAggregate,
    sellerReleasedAggregate,
    riderReleasedAggregate,
    sellerPendingAggregate,
    riderPendingAggregate,
    refundAggregate,
  ] = await Promise.all([
    prisma.order.aggregate({
      where: {
        isPaid: true,
        createdAt: {
          gte: startDate,
          lte: endDate,
        },
      },
      _sum: {
        totalAmount: true,
      },
      _count: {
        _all: true,
      },
    }),
    prisma.orderSellerGroup.aggregate({
      where: {
        payoutStatus: "COMPLETED",
        payoutReleasedAt: {
          not: null,
          gte: startDate,
          lte: endDate,
        },
      },
      _sum: {
        platformCommission: true,
      },
    }),
    prisma.orderSellerGroup.aggregate({
      where: {
        payoutStatus: "COMPLETED",
        payoutReleasedAt: {
          not: null,
          gte: startDate,
          lte: endDate,
        },
      },
      _sum: {
        sellerRevenue: true,
      },
    }),
    prisma.delivery.aggregate({
      where: {
        payoutReleasedAt: {
          not: null,
          gte: startDate,
          lte: endDate,
        },
      },
      _sum: {
        riderPayoutAmount: true,
      },
    }),
    prisma.orderSellerGroup.aggregate({
      where: {
        sellerRevenue: {
          gt: 0,
        },
        payoutReleasedAt: null,
        payoutStatus: {
          notIn: ["COMPLETED", "CANCELLED"],
        },
        order: {
          isPaid: true,
          status: {
            in: ["DELIVERED", "DISPUTED"],
          },
        },
      },
      _sum: {
        sellerRevenue: true,
      },
    }),
    prisma.delivery.aggregate({
      where: {
        riderPayoutAmount: {
          gt: 0,
        },
        payoutReleasedAt: null,
        status: "DELIVERED",
        order: {
          isPaid: true,
        },
      },
      _sum: {
        riderPayoutAmount: true,
      },
    }),
    prisma.transaction.aggregate({
      where: {
        type: "REFUND",
        status: "SUCCESS",
        createdAt: {
          gte: startDate,
          lte: endDate,
        },
      },
      _sum: {
        amount: true,
      },
    }),
  ]);

  const grossRevenue = orderAggregate._sum.totalAmount ?? 0;
  const platformCommissionRecognized =
    platformAggregate._sum.platformCommission ?? 0;
  const sellerPayoutsReleased = sellerReleasedAggregate._sum.sellerRevenue ?? 0;
  const riderPayoutsReleased = riderReleasedAggregate._sum.riderPayoutAmount ?? 0;
  const pendingSellerPayouts = sellerPendingAggregate._sum.sellerRevenue ?? 0;
  const pendingRiderPayouts = riderPendingAggregate._sum.riderPayoutAmount ?? 0;
  const refundsInRange = refundAggregate._sum.amount ?? 0;
  const ordersCount = orderAggregate._count._all ?? 0;

  return {
    grossRevenue,
    platformCommissionRecognized,
    sellerPayoutsReleased,
    riderPayoutsReleased,
    totalPayoutsReleased: sellerPayoutsReleased + riderPayoutsReleased,
    pendingSellerPayouts,
    pendingRiderPayouts,
    pendingTotalPayoutLiability: pendingSellerPayouts + pendingRiderPayouts,
    refundsInRange,
    netPlatformRetainedRevenue:
      platformCommissionRecognized - refundsInRange,
    averageOrderValue: ordersCount > 0 ? grossRevenue / ordersCount : 0,
    ordersCount,
  };
}

async function getBucketedGrossRevenue(range: AnalyticsDateRange) {
  const { startDate, endDate } = startAndEnd(range);
  const granularity = getAnalyticsBucketGranularity(range);

  const rows = await prisma.$queryRaw<BucketRow[]>(Prisma.sql`
    SELECT
      date_trunc(${granularity}, "createdAt") AS bucket,
      COALESCE(SUM("totalAmount"), 0)::double precision AS value
    FROM "Order"
    WHERE "isPaid" = true
      AND "createdAt" >= ${startDate}
      AND "createdAt" <= ${endDate}
    GROUP BY bucket
    ORDER BY bucket ASC
  `);

  return buildTrendPoints(rows, granularity);
}

async function getBucketedPlatformCommission(range: AnalyticsDateRange) {
  const { startDate, endDate } = startAndEnd(range);
  const granularity = getAnalyticsBucketGranularity(range);

  const rows = await prisma.$queryRaw<BucketRow[]>(Prisma.sql`
    SELECT
      date_trunc(${granularity}, "payoutReleasedAt") AS bucket,
      COALESCE(SUM("platformCommission"), 0)::double precision AS value
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

async function getBucketedRefunds(range: AnalyticsDateRange) {
  const { startDate, endDate } = startAndEnd(range);
  const granularity = getAnalyticsBucketGranularity(range);

  const rows = await prisma.$queryRaw<BucketRow[]>(Prisma.sql`
    SELECT
      date_trunc(${granularity}, "createdAt") AS bucket,
      COALESCE(SUM("amount"), 0)::double precision AS value
    FROM "Transaction"
    WHERE "type" = 'REFUND'
      AND "status" = 'SUCCESS'
      AND "createdAt" >= ${startDate}
      AND "createdAt" <= ${endDate}
    GROUP BY bucket
    ORDER BY bucket ASC
  `);

  return buildTrendPoints(rows, granularity);
}

async function getRevenueBreakdowns(range: AnalyticsDateRange) {
  const { startDate, endDate } = startAndEnd(range);

  const [
    revenueByPaymentMethod,
    revenueByDeliveryType,
    topEarningSellers,
    topPlatformContributors,
    sellerPayoutExposure,
    riderPayoutExposure,
  ] = await Promise.all([
    prisma.$queryRaw<CountRow[]>(Prisma.sql`
      SELECT
        "paymentMethod"::text AS key,
        COALESCE(SUM("totalAmount"), 0)::double precision AS value
      FROM "Order"
      WHERE "isPaid" = true
        AND "createdAt" >= ${startDate}
        AND "createdAt" <= ${endDate}
      GROUP BY "paymentMethod"
      ORDER BY value DESC
    `),
    prisma.$queryRaw<CountRow[]>(Prisma.sql`
      SELECT
        "deliveryType"::text AS key,
        COALESCE(SUM("totalAmount"), 0)::double precision AS value
      FROM "Order"
      WHERE "isPaid" = true
        AND "createdAt" >= ${startDate}
        AND "createdAt" <= ${endDate}
      GROUP BY "deliveryType"
      ORDER BY value DESC
    `),
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
      WHERE o."isPaid" = true
        AND o."createdAt" >= ${startDate}
        AND o."createdAt" <= ${endDate}
      GROUP BY u.id, s.name, u.name, u.email
      ORDER BY value DESC
      LIMIT 8
    `),
    prisma.$queryRaw<ValueBreakdown[]>(Prisma.sql`
      SELECT
        u.id AS key,
        COALESCE(s.name, u.name, u.email) AS label,
        COALESCE(SUM(osg."platformCommission"), 0)::double precision AS value,
        COUNT(DISTINCT osg."orderId")::double precision AS "secondaryValue"
      FROM "OrderSellerGroup" osg
      INNER JOIN "User" u ON u.id = osg."sellerId"
      LEFT JOIN "Store" s ON s."userId" = u.id
      WHERE osg."payoutStatus" = 'COMPLETED'
        AND osg."payoutReleasedAt" IS NOT NULL
        AND osg."payoutReleasedAt" >= ${startDate}
        AND osg."payoutReleasedAt" <= ${endDate}
      GROUP BY u.id, s.name, u.name, u.email
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
  ]);

  return {
    revenueByPaymentMethod: revenueByPaymentMethod.map((row) => ({
      key: row.key ?? "UNKNOWN",
      label: labelEnumValue(row.key),
      value: row.value ?? 0,
    })),
    revenueByDeliveryType: revenueByDeliveryType.map((row) => ({
      key: row.key ?? "UNKNOWN",
      label: labelEnumValue(row.key),
      value: row.value ?? 0,
    })),
    topEarningSellers,
    topPlatformContributors,
    sellerPayoutExposure,
    riderPayoutExposure,
  };
}

async function getSellerPayoutReport(range: AnalyticsDateRange) {
  const { startDate, endDate } = startAndEnd(range);

  const rows = await prisma.$queryRaw<
    Array<{
      key: string;
      sellerLabel: string;
      ordersCount: number;
      sellerRevenueInRange: number;
      pendingPayout: number;
      releasedPayout: number;
      lastPayoutDate: Date | null;
    }>
  >(Prisma.sql`
    SELECT
      u.id AS key,
      COALESCE(s.name, u.name, u.email) AS "sellerLabel",
      COUNT(DISTINCT CASE
        WHEN o."isPaid" = true
         AND o."createdAt" >= ${startDate}
         AND o."createdAt" <= ${endDate}
        THEN osg."orderId"
      END)::double precision AS "ordersCount",
      COALESCE(SUM(CASE
        WHEN o."isPaid" = true
         AND o."createdAt" >= ${startDate}
         AND o."createdAt" <= ${endDate}
        THEN osg."sellerRevenue"
        ELSE 0
      END), 0)::double precision AS "sellerRevenueInRange",
      COALESCE(SUM(CASE
        WHEN osg."sellerRevenue" > 0
         AND osg."payoutReleasedAt" IS NULL
         AND osg."payoutStatus" NOT IN ('COMPLETED', 'CANCELLED')
         AND o."isPaid" = true
         AND o."status" IN ('DELIVERED', 'DISPUTED')
        THEN osg."sellerRevenue"
        ELSE 0
      END), 0)::double precision AS "pendingPayout",
      COALESCE(SUM(CASE
        WHEN osg."payoutStatus" = 'COMPLETED'
         AND osg."payoutReleasedAt" IS NOT NULL
         AND osg."payoutReleasedAt" >= ${startDate}
         AND osg."payoutReleasedAt" <= ${endDate}
        THEN osg."sellerRevenue"
        ELSE 0
      END), 0)::double precision AS "releasedPayout",
      MAX(osg."payoutReleasedAt") AS "lastPayoutDate"
    FROM "OrderSellerGroup" osg
    INNER JOIN "Order" o ON o.id = osg."orderId"
    INNER JOIN "User" u ON u.id = osg."sellerId"
    LEFT JOIN "Store" s ON s."userId" = u.id
    GROUP BY u.id, s.name, u.name, u.email
    HAVING
      COALESCE(SUM(CASE
        WHEN o."isPaid" = true
         AND o."createdAt" >= ${startDate}
         AND o."createdAt" <= ${endDate}
        THEN osg."sellerRevenue"
        ELSE 0
      END), 0) > 0
      OR COALESCE(SUM(CASE
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
    ORDER BY "releasedPayout" DESC, "pendingPayout" DESC, "sellerRevenueInRange" DESC
    LIMIT 16
  `);

  return rows.map((row) => ({
    ...row,
    lastPayoutDate: row.lastPayoutDate?.toISOString() ?? null,
  }));
}

async function getRiderPayoutReport(range: AnalyticsDateRange) {
  const { startDate, endDate } = startAndEnd(range);

  const rows = await prisma.$queryRaw<
    Array<{
      key: string;
      riderLabel: string;
      deliveriesCount: number;
      pendingPayout: number;
      releasedPayout: number;
      lastPayoutDate: Date | null;
    }>
  >(Prisma.sql`
    SELECT
      u.id AS key,
      COALESCE(u.name, u.email) AS "riderLabel",
      COUNT(CASE
        WHEN d."status" = 'DELIVERED'
         AND d."deliveredAt" IS NOT NULL
         AND d."deliveredAt" >= ${startDate}
         AND d."deliveredAt" <= ${endDate}
        THEN 1
      END)::double precision AS "deliveriesCount",
      COALESCE(SUM(CASE
        WHEN d."riderPayoutAmount" > 0
         AND d."payoutReleasedAt" IS NULL
         AND d."status" = 'DELIVERED'
         AND o."isPaid" = true
        THEN d."riderPayoutAmount"
        ELSE 0
      END), 0)::double precision AS "pendingPayout",
      COALESCE(SUM(CASE
        WHEN d."payoutReleasedAt" IS NOT NULL
         AND d."payoutReleasedAt" >= ${startDate}
         AND d."payoutReleasedAt" <= ${endDate}
        THEN d."riderPayoutAmount"
        ELSE 0
      END), 0)::double precision AS "releasedPayout",
      MAX(d."payoutReleasedAt") AS "lastPayoutDate"
    FROM "Delivery" d
    INNER JOIN "Order" o ON o.id = d."orderId"
    INNER JOIN "User" u ON u.id = d."riderId"
    WHERE d."riderId" IS NOT NULL
    GROUP BY u.id, u.name, u.email
    HAVING
      COUNT(CASE
        WHEN d."status" = 'DELIVERED'
         AND d."deliveredAt" IS NOT NULL
         AND d."deliveredAt" >= ${startDate}
         AND d."deliveredAt" <= ${endDate}
        THEN 1
      END) > 0
      OR COALESCE(SUM(CASE
        WHEN d."riderPayoutAmount" > 0
         AND d."payoutReleasedAt" IS NULL
         AND d."status" = 'DELIVERED'
         AND o."isPaid" = true
        THEN d."riderPayoutAmount"
        ELSE 0
      END), 0) > 0
      OR COALESCE(SUM(CASE
        WHEN d."payoutReleasedAt" IS NOT NULL
         AND d."payoutReleasedAt" >= ${startDate}
         AND d."payoutReleasedAt" <= ${endDate}
        THEN d."riderPayoutAmount"
        ELSE 0
      END), 0) > 0
    ORDER BY "releasedPayout" DESC, "pendingPayout" DESC, "deliveriesCount" DESC
    LIMIT 16
  `);

  return rows.map((row) => ({
    ...row,
    lastPayoutDate: row.lastPayoutDate?.toISOString() ?? null,
  }));
}

async function getPlatformRevenueReport(range: AnalyticsDateRange) {
  const { startDate, endDate } = startAndEnd(range);

  return prisma.$queryRaw<PlatformRevenueReportRow[]>(Prisma.sql`
    SELECT
      u.id AS key,
      COALESCE(s.name, u.name, u.email) AS "sellerLabel",
      COALESCE(SUM(CASE
        WHEN o."isPaid" = true
         AND o."createdAt" >= ${startDate}
         AND o."createdAt" <= ${endDate}
        THEN osg."subtotal" + osg."shippingFee"
        ELSE 0
      END), 0)::double precision AS "gmvContribution",
      COALESCE(SUM(CASE
        WHEN osg."payoutStatus" = 'COMPLETED'
         AND osg."payoutReleasedAt" IS NOT NULL
         AND osg."payoutReleasedAt" >= ${startDate}
         AND osg."payoutReleasedAt" <= ${endDate}
        THEN osg."platformCommission"
        ELSE 0
      END), 0)::double precision AS "platformCommissionContribution",
      COUNT(DISTINCT CASE
        WHEN o."isPaid" = true
         AND o."createdAt" >= ${startDate}
         AND o."createdAt" <= ${endDate}
        THEN osg."orderId"
      END)::double precision AS "ordersCount"
    FROM "OrderSellerGroup" osg
    INNER JOIN "Order" o ON o.id = osg."orderId"
    INNER JOIN "User" u ON u.id = osg."sellerId"
    LEFT JOIN "Store" s ON s."userId" = u.id
    GROUP BY u.id, s.name, u.name, u.email
    HAVING
      COALESCE(SUM(CASE
        WHEN o."isPaid" = true
         AND o."createdAt" >= ${startDate}
         AND o."createdAt" <= ${endDate}
        THEN osg."subtotal" + osg."shippingFee"
        ELSE 0
      END), 0) > 0
      OR COALESCE(SUM(CASE
        WHEN osg."payoutStatus" = 'COMPLETED'
         AND osg."payoutReleasedAt" IS NOT NULL
         AND osg."payoutReleasedAt" >= ${startDate}
         AND osg."payoutReleasedAt" <= ${endDate}
        THEN osg."platformCommission"
        ELSE 0
      END), 0) > 0
    ORDER BY "platformCommissionContribution" DESC, "gmvContribution" DESC
    LIMIT 16
  `);
}

async function getRefundReport(range: AnalyticsDateRange) {
  const { startDate, endDate } = startAndEnd(range);

  const rows = await prisma.transaction.findMany({
    where: {
      type: "REFUND",
      status: "SUCCESS",
      createdAt: {
        gte: startDate,
        lte: endDate,
      },
    },
    orderBy: {
      createdAt: "desc",
    },
    take: 20,
    select: {
      id: true,
      amount: true,
      status: true,
      createdAt: true,
      reference: true,
      order: {
        select: {
          id: true,
          trackingNumber: true,
          customer: {
            select: {
              name: true,
              email: true,
            },
          },
        },
      },
    },
  });

  return rows.map((row) => ({
    key: row.id,
    orderReference:
      row.order?.trackingNumber ??
      row.order?.id ??
      row.reference ??
      row.id,
    customerLabel:
      row.order?.customer.name ??
      row.order?.customer.email ??
      "Unknown customer",
    amount: row.amount,
    status: row.status,
    createdAt: row.createdAt.toISOString(),
  }));
}

export async function getAdminRevenueReports(
  range: AnalyticsDateRange,
): Promise<RevenueReportsResponse> {
  const { startDate, endDate } = startAndEnd(range);
  const previousRange = getPreviousAnalyticsDateRange(range);
  const previousStartDate = new Date(previousRange.startDate);
  const previousEndDate = new Date(previousRange.endDate);

  const [
    summary,
    previousSummary,
    grossRevenueTrend,
    platformCommissionTrend,
    sellerPayoutsTrend,
    riderPayoutsTrend,
    refundsTrend,
    breakdowns,
    sellerPayoutReport,
    riderPayoutReport,
    platformRevenueReport,
    refundReport,
  ] = await Promise.all([
    getRevenueSummary(startDate, endDate),
    getRevenueSummary(previousStartDate, previousEndDate),
    getBucketedGrossRevenue(range),
    getBucketedPlatformCommission(range),
    getBucketedSellerPayouts(range),
    getBucketedRiderPayouts(range),
    getBucketedRefunds(range),
    getRevenueBreakdowns(range),
    getSellerPayoutReport(range),
    getRiderPayoutReport(range),
    getPlatformRevenueReport(range),
    getRefundReport(range),
  ]);

  return {
    range,
    summary,
    changes: {
      grossRevenue: calculateChange(
        summary.grossRevenue,
        previousSummary.grossRevenue,
      ),
      platformCommissionRecognized: calculateChange(
        summary.platformCommissionRecognized,
        previousSummary.platformCommissionRecognized,
      ),
      totalPayoutsReleased: calculateChange(
        summary.totalPayoutsReleased,
        previousSummary.totalPayoutsReleased,
      ),
      refundsInRange: calculateChange(
        summary.refundsInRange,
        previousSummary.refundsInRange,
      ),
      netPlatformRetainedRevenue: calculateChange(
        summary.netPlatformRetainedRevenue,
        previousSummary.netPlatformRetainedRevenue,
      ),
      averageOrderValue: calculateChange(
        summary.averageOrderValue,
        previousSummary.averageOrderValue,
      ),
    },
    trends: {
      grossRevenue: grossRevenueTrend,
      platformCommission: platformCommissionTrend,
      sellerPayouts: sellerPayoutsTrend,
      riderPayouts: riderPayoutsTrend,
      refunds: refundsTrend,
      netRetainedRevenue: mergeTrendPoints(
        platformCommissionTrend,
        refundsTrend,
        (commission, refunds) => commission - refunds,
      ),
    },
    breakdowns,
    reports: {
      sellerPayouts: sellerPayoutReport,
      riderPayouts: riderPayoutReport,
      platformRevenue: platformRevenueReport,
      refunds: refundReport,
    },
  };
}
