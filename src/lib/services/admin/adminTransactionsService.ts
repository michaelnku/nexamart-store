import { Prisma, TransactionStatus, TransactionType } from "@/generated/prisma";

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

export type AdminTransactionRow = {
  id: string;
  type: TransactionType;
  status: TransactionStatus;
  amount: number;
  reference: string | null;
  description: string | null;
  createdAt: string;
  updatedAt: string;
  walletId: string | null;
  orderId: string | null;
  userId: string | null;
  userLabel: string;
  userRole: string | null;
  orderTrackingNumber: string | null;
  paymentMethod: string | null;
};

export type AdminTransactionsDashboardResponse = {
  range: AnalyticsDateRange;
  snapshot: {
    totalTransactions: number;
    successfulTransactions: number;
    pendingTransactions: number;
    failedTransactions: number;
    cancelledTransactions: number;
  };
  rangeSummary: {
    transactionVolume: number;
    successfulAmount: number;
    refundsAmount: number;
    payoutsAmount: number;
    depositsAmount: number;
    withdrawalsAmount: number;
  };
  changes: {
    transactionVolume: number | null;
    successfulAmount: number | null;
    refundsAmount: number | null;
    payoutsAmount: number | null;
    depositsAmount: number | null;
    withdrawalsAmount: number | null;
  };
  trends: {
    transactionCount: TrendPoint[];
    successfulAmount: TrendPoint[];
    refundsAmount: TrendPoint[];
  };
  breakdowns: {
    byType: CountBreakdown[];
    byStatus: CountBreakdown[];
    topUsersByAmount: ValueBreakdown[];
    topOrdersByAmount: ValueBreakdown[];
  };
  transactions: AdminTransactionRow[];
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

async function getSnapshotSummary() {
  const statusRows = await prisma.transaction.groupBy({
    by: ["status"],
    _count: { _all: true },
  });

  const counts = new Map(
    statusRows.map((row) => [row.status, row._count._all]),
  );

  const totalTransactions = statusRows.reduce(
    (sum, row) => sum + row._count._all,
    0,
  );

  return {
    totalTransactions,
    successfulTransactions: counts.get("SUCCESS") ?? 0,
    pendingTransactions: counts.get("PENDING") ?? 0,
    failedTransactions: counts.get("FAILED") ?? 0,
    cancelledTransactions: counts.get("CANCELLED") ?? 0,
  };
}

async function getRangeSummary(startDate: Date, endDate: Date) {
  const [
    transactionVolume,
    successfulAggregate,
    refundsAggregate,
    payoutsAggregate,
    depositsAggregate,
    withdrawalsAggregate,
  ] = await Promise.all([
    prisma.transaction.count({
      where: {
        createdAt: { gte: startDate, lte: endDate },
      },
    }),
    prisma.transaction.aggregate({
      where: {
        status: "SUCCESS",
        createdAt: { gte: startDate, lte: endDate },
      },
      _sum: { amount: true },
    }),
    prisma.transaction.aggregate({
      where: {
        type: "REFUND",
        status: "SUCCESS",
        createdAt: { gte: startDate, lte: endDate },
      },
      _sum: { amount: true },
    }),
    prisma.transaction.aggregate({
      where: {
        type: { in: ["SELLER_PAYOUT", "RIDER_PAYOUT"] },
        status: "SUCCESS",
        createdAt: { gte: startDate, lte: endDate },
      },
      _sum: { amount: true },
    }),
    prisma.transaction.aggregate({
      where: {
        type: "DEPOSIT",
        status: "SUCCESS",
        createdAt: { gte: startDate, lte: endDate },
      },
      _sum: { amount: true },
    }),
    prisma.transaction.aggregate({
      where: {
        type: "WITHDRAWAL",
        status: "SUCCESS",
        createdAt: { gte: startDate, lte: endDate },
      },
      _sum: { amount: true },
    }),
  ]);

  return {
    transactionVolume,
    successfulAmount: successfulAggregate._sum.amount ?? 0,
    refundsAmount: refundsAggregate._sum.amount ?? 0,
    payoutsAmount: payoutsAggregate._sum.amount ?? 0,
    depositsAmount: depositsAggregate._sum.amount ?? 0,
    withdrawalsAmount: withdrawalsAggregate._sum.amount ?? 0,
  };
}

async function getBucketedTransactionCount(range: AnalyticsDateRange) {
  const { startDate, endDate } = startAndEnd(range);
  const granularity = getAnalyticsBucketGranularity(range);

  const rows = await prisma.$queryRaw<BucketRow[]>(Prisma.sql`
    SELECT
      date_trunc(${granularity}, "createdAt") AS bucket,
      COUNT(*)::double precision AS value
    FROM "Transaction"
    WHERE "createdAt" >= ${startDate}
      AND "createdAt" <= ${endDate}
    GROUP BY bucket
    ORDER BY bucket ASC
  `);

  return buildTrendPoints(rows, granularity);
}

async function getBucketedSuccessfulAmount(range: AnalyticsDateRange) {
  const { startDate, endDate } = startAndEnd(range);
  const granularity = getAnalyticsBucketGranularity(range);

  const rows = await prisma.$queryRaw<BucketRow[]>(Prisma.sql`
    SELECT
      date_trunc(${granularity}, "createdAt") AS bucket,
      COALESCE(SUM("amount"), 0)::double precision AS value
    FROM "Transaction"
    WHERE "status" = 'SUCCESS'
      AND "createdAt" >= ${startDate}
      AND "createdAt" <= ${endDate}
    GROUP BY bucket
    ORDER BY bucket ASC
  `);

  return buildTrendPoints(rows, granularity);
}

async function getBucketedRefundsAmount(range: AnalyticsDateRange) {
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

async function getBreakdowns(range: AnalyticsDateRange) {
  const { startDate, endDate } = startAndEnd(range);

  const [typeRows, statusRows, topUsersByAmount, topOrdersByAmount] =
    await Promise.all([
      prisma.transaction.groupBy({
        by: ["type"],
        _count: { _all: true },
        where: {
          createdAt: { gte: startDate, lte: endDate },
        },
        orderBy: {
          _count: {
            type: "desc",
          },
        },
      }),
      prisma.transaction.groupBy({
        by: ["status"],
        _count: { _all: true },
        where: {
          createdAt: { gte: startDate, lte: endDate },
        },
        orderBy: {
          _count: {
            status: "desc",
          },
        },
      }),
      prisma.$queryRaw<ValueBreakdown[]>(Prisma.sql`
        SELECT
          u.id AS key,
          COALESCE(u.name, u.email) AS label,
          COALESCE(SUM(t."amount"), 0)::double precision AS value,
          COUNT(t.id)::double precision AS "secondaryValue"
        FROM "Transaction" t
        INNER JOIN "User" u ON u.id = t."userId"
        WHERE t."createdAt" >= ${startDate}
          AND t."createdAt" <= ${endDate}
        GROUP BY u.id, u.name, u.email
        ORDER BY value DESC, "secondaryValue" DESC
        LIMIT 8
      `),
      prisma.$queryRaw<ValueBreakdown[]>(Prisma.sql`
        SELECT
          o.id AS key,
          COALESCE(o."trackingNumber", o.id) AS label,
          COALESCE(SUM(t."amount"), 0)::double precision AS value,
          COUNT(t.id)::double precision AS "secondaryValue"
        FROM "Transaction" t
        INNER JOIN "Order" o ON o.id = t."orderId"
        WHERE t."createdAt" >= ${startDate}
          AND t."createdAt" <= ${endDate}
        GROUP BY o.id, o."trackingNumber"
        ORDER BY value DESC, "secondaryValue" DESC
        LIMIT 8
      `),
    ]);

  return {
    byType: typeRows.map((row) => ({
      key: row.type,
      label: labelEnumValue(row.type),
      count: row._count._all,
    })),
    byStatus: statusRows.map((row) => ({
      key: row.status,
      label: labelEnumValue(row.status),
      count: row._count._all,
    })),
    topUsersByAmount,
    topOrdersByAmount,
  };
}

async function getTransactionsTable(range: AnalyticsDateRange) {
  const { startDate, endDate } = startAndEnd(range);

  const rows = await prisma.transaction.findMany({
    where: {
      createdAt: { gte: startDate, lte: endDate },
    },
    orderBy: { createdAt: "desc" },
    take: 100,
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
        },
      },
      order: {
        select: {
          id: true,
          trackingNumber: true,
          paymentMethod: true,
        },
      },
    },
  });

  return rows.map((row) => ({
    id: row.id,
    type: row.type,
    status: row.status,
    amount: row.amount,
    reference: row.reference ?? null,
    description: row.description ?? null,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
    walletId: row.walletId ?? null,
    orderId: row.orderId ?? null,
    userId: row.userId ?? null,
    userLabel: row.user
      ? row.user.name?.trim() || row.user.email
      : "System / Unlinked",
    userRole: row.user?.role ?? null,
    orderTrackingNumber: row.order?.trackingNumber ?? null,
    paymentMethod: row.order?.paymentMethod ?? null,
  }));
}

export async function getAdminTransactionsDashboard(
  range: AnalyticsDateRange,
): Promise<AdminTransactionsDashboardResponse> {
  const previousRange = getPreviousAnalyticsDateRange(range);
  const previousStartDate = new Date(previousRange.startDate);
  const previousEndDate = new Date(previousRange.endDate);

  const [
    snapshot,
    rangeSummary,
    previousRangeSummary,
    transactionCountTrend,
    successfulAmountTrend,
    refundsAmountTrend,
    breakdowns,
    transactions,
  ] = await Promise.all([
    getSnapshotSummary(),
    getRangeSummary(new Date(range.startDate), new Date(range.endDate)),
    getRangeSummary(previousStartDate, previousEndDate),
    getBucketedTransactionCount(range),
    getBucketedSuccessfulAmount(range),
    getBucketedRefundsAmount(range),
    getBreakdowns(range),
    getTransactionsTable(range),
  ]);

  return {
    range,
    snapshot,
    rangeSummary,
    changes: {
      transactionVolume: calculateChange(
        rangeSummary.transactionVolume,
        previousRangeSummary.transactionVolume,
      ),
      successfulAmount: calculateChange(
        rangeSummary.successfulAmount,
        previousRangeSummary.successfulAmount,
      ),
      refundsAmount: calculateChange(
        rangeSummary.refundsAmount,
        previousRangeSummary.refundsAmount,
      ),
      payoutsAmount: calculateChange(
        rangeSummary.payoutsAmount,
        previousRangeSummary.payoutsAmount,
      ),
      depositsAmount: calculateChange(
        rangeSummary.depositsAmount,
        previousRangeSummary.depositsAmount,
      ),
      withdrawalsAmount: calculateChange(
        rangeSummary.withdrawalsAmount,
        previousRangeSummary.withdrawalsAmount,
      ),
    },
    trends: {
      transactionCount: transactionCountTrend,
      successfulAmount: successfulAmountTrend,
      refundsAmount: refundsAmountTrend,
    },
    breakdowns,
    transactions,
  };
}
