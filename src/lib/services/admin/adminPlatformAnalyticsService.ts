import { Prisma, UserRole } from "@/generated/prisma";

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

export type PlatformAnalyticsSummary = {
  totalGmv: number;
  totalPlatformRevenue: number;
  totalOrders: number;
  totalCustomers: number;
  totalSellers: number;
  totalRiders: number;
  pendingPayoutsTotal: number;
  completedPayoutsTotal: number;
  refundsTotal: number;
  activeStoresCount: number;
  averageOrderValue: number;
};

export type PlatformAnalyticsChanges = {
  totalGmv: number | null;
  totalPlatformRevenue: number | null;
  totalOrders: number | null;
  newUsers: number | null;
  newSellers: number | null;
  averageOrderValue: number | null;
};

export type PlatformAnalyticsResponse = {
  range: AnalyticsDateRange;
  summary: PlatformAnalyticsSummary;
  changes: PlatformAnalyticsChanges;
  trends: {
    gmv: TrendPoint[];
    platformRevenue: TrendPoint[];
    orders: TrendPoint[];
    newUsers: TrendPoint[];
    newSellers: TrendPoint[];
    payouts: TrendPoint[];
  };
  breakdowns: {
    orderStatuses: CountBreakdown[];
    paymentMethods: CountBreakdown[];
    deliveryTypes: CountBreakdown[];
    categories: ValueBreakdown[];
    topSellers: ValueBreakdown[];
    topProducts: ValueBreakdown[];
    topCustomers: ValueBreakdown[];
  };
};

type BucketRow = {
  bucket: Date;
  value: number;
};

type CountRow = {
  key: string | null;
  count: bigint | number;
};

type ValueRow = {
  key: string;
  label: string;
  value: number;
  secondaryValue?: number;
};

function toNumber(value: bigint | number | null | undefined) {
  if (typeof value === "bigint") {
    return Number(value);
  }

  return value ?? 0;
}

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

function mapCountRows(rows: CountRow[]) {
  return rows.map((row) => ({
    key: row.key ?? "UNKNOWN",
    label: labelEnumValue(row.key),
    count: toNumber(row.count),
  }));
}

async function getOrderValueSummary(startDate: Date, endDate: Date) {
  const aggregate = await prisma.order.aggregate({
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
  });

  return {
    totalGmv: aggregate._sum.totalAmount ?? 0,
    totalOrders: aggregate._count._all ?? 0,
  };
}

async function getPlatformRevenueForRange(startDate: Date, endDate: Date) {
  // Platform commission becomes recognized when a seller group payout is
  // actually released. `EscrowLedger.createdAt` is earlier because the held
  // commission entry is created before release.
  const aggregate = await prisma.orderSellerGroup.aggregate({
    where: {
      payoutReleasedAt: {
        not: null,
        gte: startDate,
        lte: endDate,
      },
      payoutStatus: "COMPLETED",
    },
    _sum: {
      platformCommission: true,
    },
  });

  return aggregate._sum.platformCommission ?? 0;
}

async function getRefundsForRange(startDate: Date, endDate: Date) {
  // Refund transactions are the cleanest source of truth available here because
  // disputes do not currently store a dedicated resolved-at timestamp.
  const aggregate = await prisma.transaction.aggregate({
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
  });

  return aggregate._sum.amount ?? 0;
}

async function getNewUsersCount(
  role: UserRole,
  startDate: Date,
  endDate: Date,
) {
  return prisma.user.count({
    where: {
      role,
      isDeleted: false,
      createdAt: {
        gte: startDate,
        lte: endDate,
      },
    },
  });
}

async function getSnapshotSummary(endDate: Date) {
  const [
    totalCustomers,
    totalSellers,
    totalRiders,
    activeStoresCount,
    sellerPendingAggregate,
    sellerCompletedAggregate,
    riderPendingAggregate,
    riderCompletedAggregate,
  ] = await Promise.all([
    prisma.user.count({
      where: {
        role: UserRole.USER,
        isDeleted: false,
        createdAt: { lte: endDate },
      },
    }),
    prisma.user.count({
      where: {
        role: UserRole.SELLER,
        isDeleted: false,
        createdAt: { lte: endDate },
      },
    }),
    prisma.user.count({
      where: {
        role: UserRole.RIDER,
        isDeleted: false,
        createdAt: { lte: endDate },
      },
    }),
    prisma.store.count({
      where: {
        createdAt: { lte: endDate },
        isActive: true,
        isSuspended: false,
        isDeleted: false,
      },
    }),
    prisma.orderSellerGroup.aggregate({
      where: {
        createdAt: { lte: endDate },
        payoutStatus: {
          notIn: ["COMPLETED", "CANCELLED"],
        },
        order: {
          status: {
            not: "CANCELLED",
          },
        },
      },
      _sum: {
        sellerRevenue: true,
      },
    }),
    prisma.orderSellerGroup.aggregate({
      where: {
        payoutReleasedAt: {
          not: null,
          lte: endDate,
        },
        payoutStatus: "COMPLETED",
      },
      _sum: {
        sellerRevenue: true,
      },
    }),
    prisma.delivery.aggregate({
      where: {
        payoutReleasedAt: null,
        status: {
          not: "CANCELLED",
        },
        order: {
          createdAt: {
            lte: endDate,
          },
        },
      },
      _sum: {
        riderPayoutAmount: true,
      },
    }),
    prisma.delivery.aggregate({
      where: {
        payoutReleasedAt: {
          not: null,
          lte: endDate,
        },
      },
      _sum: {
        riderPayoutAmount: true,
      },
    }),
  ]);

  return {
    totalCustomers,
    totalSellers,
    totalRiders,
    activeStoresCount,
    pendingPayoutsTotal:
      (sellerPendingAggregate._sum.sellerRevenue ?? 0) +
      (riderPendingAggregate._sum.riderPayoutAmount ?? 0),
    completedPayoutsTotal:
      (sellerCompletedAggregate._sum.sellerRevenue ?? 0) +
      (riderCompletedAggregate._sum.riderPayoutAmount ?? 0),
  };
}

async function getBucketedOrderMetric(
  range: AnalyticsDateRange,
  column: Prisma.Sql,
) {
  const { startDate, endDate } = startAndEnd(range);
  const granularity = getAnalyticsBucketGranularity(range);

  const rows = await prisma.$queryRaw<BucketRow[]>(Prisma.sql`
    SELECT
      date_trunc(${granularity}, "createdAt") AS bucket,
      COALESCE(SUM(${column}), 0)::double precision AS value
    FROM "Order"
    WHERE "isPaid" = true
      AND "createdAt" >= ${startDate}
      AND "createdAt" <= ${endDate}
    GROUP BY bucket
    ORDER BY bucket ASC
  `);

  return buildTrendPoints(rows, granularity);
}

async function getBucketedUserRegistrations(
  range: AnalyticsDateRange,
  role: UserRole,
) {
  const { startDate, endDate } = startAndEnd(range);
  const granularity = getAnalyticsBucketGranularity(range);
  const rows = await prisma.$queryRaw<BucketRow[]>(Prisma.sql`
    SELECT
      date_trunc(${granularity}, "createdAt") AS bucket,
      COUNT(*)::double precision AS value
    FROM "User"
    WHERE "role" = ${role}
      AND "isDeleted" = false
      AND "createdAt" >= ${startDate}
      AND "createdAt" <= ${endDate}
    GROUP BY bucket
    ORDER BY bucket ASC
  `);

  return buildTrendPoints(rows, granularity);
}

async function getBucketedPlatformRevenue(range: AnalyticsDateRange) {
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

async function getBucketedPayouts(range: AnalyticsDateRange) {
  const { startDate, endDate } = startAndEnd(range);
  const granularity = getAnalyticsBucketGranularity(range);

  const rows = await prisma.$queryRaw<BucketRow[]>(Prisma.sql`
    SELECT
      bucket,
      SUM(value)::double precision AS value
    FROM (
      SELECT
        date_trunc(${granularity}, "payoutReleasedAt") AS bucket,
        COALESCE(SUM("sellerRevenue"), 0) AS value
      FROM "OrderSellerGroup"
      WHERE "payoutStatus" = 'COMPLETED'
        AND "payoutReleasedAt" IS NOT NULL
        AND "payoutReleasedAt" >= ${startDate}
        AND "payoutReleasedAt" <= ${endDate}
      GROUP BY bucket

      UNION ALL

      SELECT
        date_trunc(${granularity}, "payoutReleasedAt") AS bucket,
        COALESCE(SUM("riderPayoutAmount"), 0) AS value
      FROM "Delivery"
      WHERE "payoutReleasedAt" IS NOT NULL
        AND "payoutReleasedAt" >= ${startDate}
        AND "payoutReleasedAt" <= ${endDate}
      GROUP BY bucket
    ) merged
    GROUP BY bucket
    ORDER BY bucket ASC
  `);

  return buildTrendPoints(rows, granularity);
}

async function getCountBreakdowns(range: AnalyticsDateRange) {
  const { startDate, endDate } = startAndEnd(range);
  const [orderStatuses, paymentMethods, deliveryTypes] = await Promise.all([
    prisma.$queryRaw<CountRow[]>(Prisma.sql`
      SELECT "status"::text AS key, COUNT(*) AS count
      FROM "Order"
      WHERE "isPaid" = true
        AND "createdAt" >= ${startDate}
        AND "createdAt" <= ${endDate}
      GROUP BY "status"
      ORDER BY COUNT(*) DESC
    `),
    prisma.$queryRaw<CountRow[]>(Prisma.sql`
      SELECT "paymentMethod"::text AS key, COUNT(*) AS count
      FROM "Order"
      WHERE "isPaid" = true
        AND "createdAt" >= ${startDate}
        AND "createdAt" <= ${endDate}
      GROUP BY "paymentMethod"
      ORDER BY COUNT(*) DESC
    `),
    prisma.$queryRaw<CountRow[]>(Prisma.sql`
      SELECT "deliveryType"::text AS key, COUNT(*) AS count
      FROM "Order"
      WHERE "isPaid" = true
        AND "createdAt" >= ${startDate}
        AND "createdAt" <= ${endDate}
      GROUP BY "deliveryType"
      ORDER BY COUNT(*) DESC
    `),
  ]);

  return {
    orderStatuses: mapCountRows(orderStatuses),
    paymentMethods: mapCountRows(paymentMethods),
    deliveryTypes: mapCountRows(deliveryTypes),
  };
}

async function getValueBreakdowns(range: AnalyticsDateRange) {
  const { startDate, endDate } = startAndEnd(range);
  const [categories, topSellers, topProducts, topCustomers] = await Promise.all([
    prisma.$queryRaw<ValueRow[]>(Prisma.sql`
      SELECT
        c.id AS key,
        c.name AS label,
        COALESCE(SUM(oi."price" * oi."quantity"), 0)::double precision AS value,
        COUNT(DISTINCT oi."orderId")::double precision AS "secondaryValue"
      FROM "OrderItem" oi
      INNER JOIN "Order" o ON o.id = oi."orderId"
      INNER JOIN "Product" p ON p.id = oi."productId"
      INNER JOIN "Category" c ON c.id = p."categoryId"
      WHERE o."isPaid" = true
        AND o."createdAt" >= ${startDate}
        AND o."createdAt" <= ${endDate}
      GROUP BY c.id, c.name
      ORDER BY value DESC
      LIMIT 8
    `),
    prisma.$queryRaw<ValueRow[]>(Prisma.sql`
      SELECT
        u.id AS key,
        COALESCE(s.name, u.name, u.email) AS label,
        COALESCE(SUM(osg."subtotal" + osg."shippingFee"), 0)::double precision AS value,
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
    prisma.$queryRaw<ValueRow[]>(Prisma.sql`
      SELECT
        p.id AS key,
        p.name AS label,
        -- Captured order-item price is safer than current catalog price.
        COALESCE(SUM(oi."price" * oi."quantity"), 0)::double precision AS value,
        COALESCE(SUM(oi."quantity"), 0)::double precision AS "secondaryValue"
      FROM "OrderItem" oi
      INNER JOIN "Order" o ON o.id = oi."orderId"
      INNER JOIN "Product" p ON p.id = oi."productId"
      WHERE o."isPaid" = true
        AND o."createdAt" >= ${startDate}
        AND o."createdAt" <= ${endDate}
      GROUP BY p.id, p.name
      ORDER BY value DESC
      LIMIT 8
    `),
    prisma.$queryRaw<ValueRow[]>(Prisma.sql`
      SELECT
        u.id AS key,
        COALESCE(u.name, u.email) AS label,
        COALESCE(SUM(o."totalAmount"), 0)::double precision AS value,
        COUNT(o.id)::double precision AS "secondaryValue"
      FROM "Order" o
      INNER JOIN "User" u ON u.id = o."userId"
      WHERE o."isPaid" = true
        AND o."createdAt" >= ${startDate}
        AND o."createdAt" <= ${endDate}
      GROUP BY u.id, u.name, u.email
      ORDER BY value DESC
      LIMIT 8
    `),
  ]);

  return {
    categories,
    topSellers,
    topProducts,
    topCustomers,
  };
}

export async function getAdminPlatformAnalytics(
  range: AnalyticsDateRange,
): Promise<PlatformAnalyticsResponse> {
  const { startDate, endDate } = startAndEnd(range);
  const previousRange = getPreviousAnalyticsDateRange(range);
  const previousStartDate = new Date(previousRange.startDate);
  const previousEndDate = new Date(previousRange.endDate);

  const [
    currentOrderSummary,
    previousOrderSummary,
    totalPlatformRevenue,
    previousPlatformRevenue,
    refundsTotal,
    snapshotSummary,
    newUsers,
    previousNewUsers,
    newSellers,
    previousNewSellers,
    gmvTrend,
    platformRevenueTrend,
    ordersTrend,
    newUsersTrend,
    newSellersTrend,
    payoutsTrend,
    countBreakdowns,
    valueBreakdowns,
  ] = await Promise.all([
    getOrderValueSummary(startDate, endDate),
    getOrderValueSummary(previousStartDate, previousEndDate),
    getPlatformRevenueForRange(startDate, endDate),
    getPlatformRevenueForRange(previousStartDate, previousEndDate),
    getRefundsForRange(startDate, endDate),
    getSnapshotSummary(endDate),
    getNewUsersCount(UserRole.USER, startDate, endDate),
    getNewUsersCount(UserRole.USER, previousStartDate, previousEndDate),
    getNewUsersCount(UserRole.SELLER, startDate, endDate),
    getNewUsersCount(UserRole.SELLER, previousStartDate, previousEndDate),
    getBucketedOrderMetric(range, Prisma.raw(`"totalAmount"`)),
    getBucketedPlatformRevenue(range),
    getBucketedOrderMetric(
      range,
      Prisma.raw(`CASE WHEN "id" IS NOT NULL THEN 1 ELSE 0 END`),
    ),
    getBucketedUserRegistrations(range, UserRole.USER),
    getBucketedUserRegistrations(range, UserRole.SELLER),
    getBucketedPayouts(range),
    getCountBreakdowns(range),
    getValueBreakdowns(range),
  ]);

  const averageOrderValue =
    currentOrderSummary.totalOrders > 0
      ? currentOrderSummary.totalGmv / currentOrderSummary.totalOrders
      : 0;
  const previousAverageOrderValue =
    previousOrderSummary.totalOrders > 0
      ? previousOrderSummary.totalGmv / previousOrderSummary.totalOrders
      : 0;

  return {
    range,
    summary: {
      totalGmv: currentOrderSummary.totalGmv,
      totalPlatformRevenue,
      totalOrders: currentOrderSummary.totalOrders,
      totalCustomers: snapshotSummary.totalCustomers,
      totalSellers: snapshotSummary.totalSellers,
      totalRiders: snapshotSummary.totalRiders,
      pendingPayoutsTotal: snapshotSummary.pendingPayoutsTotal,
      completedPayoutsTotal: snapshotSummary.completedPayoutsTotal,
      refundsTotal,
      activeStoresCount: snapshotSummary.activeStoresCount,
      averageOrderValue,
    },
    changes: {
      totalGmv: calculateChange(
        currentOrderSummary.totalGmv,
        previousOrderSummary.totalGmv,
      ),
      totalPlatformRevenue: calculateChange(
        totalPlatformRevenue,
        previousPlatformRevenue,
      ),
      totalOrders: calculateChange(
        currentOrderSummary.totalOrders,
        previousOrderSummary.totalOrders,
      ),
      newUsers: calculateChange(newUsers, previousNewUsers),
      newSellers: calculateChange(newSellers, previousNewSellers),
      averageOrderValue: calculateChange(
        averageOrderValue,
        previousAverageOrderValue,
      ),
    },
    trends: {
      gmv: gmvTrend,
      platformRevenue: platformRevenueTrend,
      orders: ordersTrend,
      newUsers: newUsersTrend,
      newSellers: newSellersTrend,
      payouts: payoutsTrend,
    },
    breakdowns: {
      orderStatuses: countBreakdowns.orderStatuses,
      paymentMethods: countBreakdowns.paymentMethods,
      deliveryTypes: countBreakdowns.deliveryTypes,
      categories: valueBreakdowns.categories,
      topSellers: valueBreakdowns.topSellers,
      topProducts: valueBreakdowns.topProducts,
      topCustomers: valueBreakdowns.topCustomers,
    },
  };
}
