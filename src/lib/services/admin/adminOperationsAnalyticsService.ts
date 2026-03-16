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

export type OperationsAnalyticsResponse = {
  range: AnalyticsDateRange;
  summary: {
    totalDeliveries: number;
    completedDeliveries: number;
    pendingAssignmentDeliveries: number;
    inProgressDeliveries: number;
    cancelledDeliveries: number;
    assignedDeliveries: number;
    unassignedDeliveries: number;
    activeRiders: number;
    ridersWithPendingPayouts: number;
    riderPayoutsReleased: number;
    averageCompletionHours: number;
    averageAssignmentHours: number;
  };
  changes: {
    totalDeliveries: number | null;
    completedDeliveries: number | null;
    assignedDeliveries: number | null;
    activeRiders: number | null;
    riderPayoutsReleased: number | null;
    averageCompletionHours: number | null;
  };
  trends: {
    deliveries: TrendPoint[];
    completedDeliveries: TrendPoint[];
    riderPayouts: TrendPoint[];
    newRiders: TrendPoint[];
    completionHours: TrendPoint[];
    assignments: TrendPoint[];
  };
  breakdowns: {
    deliveryStatuses: CountBreakdown[];
    deliveryTypes: CountBreakdown[];
    assignmentStates: CountBreakdown[];
    topRidersByCompleted: ValueBreakdown[];
    topRidersByPayouts: ValueBreakdown[];
    topRidersByPendingExposure: ValueBreakdown[];
  };
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

async function getSummary(startDate: Date, endDate: Date) {
  const [
    totalDeliveries,
    completedDeliveries,
    pendingAssignmentDeliveries,
    inProgressDeliveries,
    cancelledDeliveries,
    assignedDeliveries,
    unassignedDeliveries,
    activeRiders,
    ridersWithPendingPayouts,
    riderPayoutsReleased,
    averageCompletionHours,
    averageAssignmentHours,
  ] = await Promise.all([
    // Delivery does not currently store its own createdAt, so the cleanest
    // canonical period anchor for "delivery orders created" is Order.createdAt.
    prisma.delivery.count({
      where: {
        order: {
          createdAt: {
            gte: startDate,
            lte: endDate,
          },
        },
      },
    }),
    prisma.delivery.count({
      where: {
        status: "DELIVERED",
        deliveredAt: {
          gte: startDate,
          lte: endDate,
        },
      },
    }),
    prisma.delivery.count({
      where: {
        status: "PENDING_ASSIGNMENT",
        order: {
          createdAt: {
            lte: endDate,
          },
        },
      },
    }),
    prisma.delivery.count({
      where: {
        status: {
          in: ["ASSIGNED", "PICKED_UP"],
        },
        order: {
          createdAt: {
            lte: endDate,
          },
        },
      },
    }),
    prisma.delivery.count({
      where: {
        status: "CANCELLED",
        order: {
          createdAt: {
            lte: endDate,
          },
        },
      },
    }),
    prisma.delivery.count({
      where: {
        assignedAt: {
          gte: startDate,
          lte: endDate,
        },
      },
    }),
    prisma.delivery.count({
      where: {
        riderId: null,
        status: "PENDING_ASSIGNMENT",
        order: {
          createdAt: {
            lte: endDate,
          },
        },
      },
    }),
    prisma.$queryRaw<{ riderId: string }[]>(Prisma.sql`
      SELECT DISTINCT "riderId"
      FROM "Delivery"
      WHERE "riderId" IS NOT NULL
        AND (
          ("assignedAt" IS NOT NULL AND "assignedAt" >= ${startDate} AND "assignedAt" <= ${endDate})
          OR ("deliveredAt" IS NOT NULL AND "deliveredAt" >= ${startDate} AND "deliveredAt" <= ${endDate})
        )
    `),
    prisma.$queryRaw<{ riderId: string }[]>(Prisma.sql`
      SELECT DISTINCT "Delivery"."riderId"
      FROM "Delivery"
      INNER JOIN "Order" ON "Order".id = "Delivery"."orderId"
      WHERE "Delivery"."riderId" IS NOT NULL
        AND "Delivery"."status" = 'DELIVERED'
        AND "Delivery"."riderPayoutAmount" > 0
        AND "Delivery"."payoutReleasedAt" IS NULL
        AND "Order"."isPaid" = true
    `),
    prisma.delivery.aggregate({
      where: {
        payoutReleasedAt: {
          gte: startDate,
          lte: endDate,
        },
      },
      _sum: {
        riderPayoutAmount: true,
      },
    }),
    prisma.$queryRaw<{ value: number | null }[]>(Prisma.sql`
      SELECT
        AVG(EXTRACT(EPOCH FROM ("deliveredAt" - "assignedAt")) / 3600.0)::double precision AS value
      FROM "Delivery"
      WHERE "status" = 'DELIVERED'
        AND "assignedAt" IS NOT NULL
        AND "deliveredAt" IS NOT NULL
        AND "deliveredAt" >= ${startDate}
        AND "deliveredAt" <= ${endDate}
    `),
    prisma.$queryRaw<{ value: number | null }[]>(Prisma.sql`
      SELECT
        AVG(EXTRACT(EPOCH FROM ("Delivery"."assignedAt" - "Order"."createdAt")) / 3600.0)::double precision AS value
      FROM "Delivery"
      INNER JOIN "Order" ON "Order".id = "Delivery"."orderId"
      WHERE "Delivery"."assignedAt" IS NOT NULL
        AND "Delivery"."assignedAt" >= ${startDate}
        AND "Delivery"."assignedAt" <= ${endDate}
    `),
  ]);

  return {
    totalDeliveries,
    completedDeliveries,
    pendingAssignmentDeliveries,
    inProgressDeliveries,
    cancelledDeliveries,
    assignedDeliveries,
    unassignedDeliveries,
    activeRiders: activeRiders.length,
    ridersWithPendingPayouts: ridersWithPendingPayouts.length,
    riderPayoutsReleased: riderPayoutsReleased._sum.riderPayoutAmount ?? 0,
    averageCompletionHours: averageCompletionHours[0]?.value ?? 0,
    averageAssignmentHours: averageAssignmentHours[0]?.value ?? 0,
  };
}

async function getBucketedDeliveries(range: AnalyticsDateRange) {
  const { startDate, endDate } = startAndEnd(range);
  const granularity = getAnalyticsBucketGranularity(range);

  const rows = await prisma.$queryRaw<BucketRow[]>(Prisma.sql`
    -- Delivery does not have createdAt, so this trend is bucketed by the
    -- underlying order creation timestamp for delivery-backed orders.
    SELECT
      date_trunc(${granularity}, "Order"."createdAt") AS bucket,
      COUNT(*)::double precision AS value
    FROM "Delivery"
    INNER JOIN "Order" ON "Order".id = "Delivery"."orderId"
    WHERE "Order"."createdAt" >= ${startDate}
      AND "Order"."createdAt" <= ${endDate}
    GROUP BY bucket
    ORDER BY bucket ASC
  `);

  return buildTrendPoints(rows, granularity);
}

async function getBucketedCompletedDeliveries(range: AnalyticsDateRange) {
  const { startDate, endDate } = startAndEnd(range);
  const granularity = getAnalyticsBucketGranularity(range);

  const rows = await prisma.$queryRaw<BucketRow[]>(Prisma.sql`
    SELECT
      date_trunc(${granularity}, "deliveredAt") AS bucket,
      COUNT(*)::double precision AS value
    FROM "Delivery"
    WHERE "status" = 'DELIVERED'
      AND "deliveredAt" IS NOT NULL
      AND "deliveredAt" >= ${startDate}
      AND "deliveredAt" <= ${endDate}
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

async function getBucketedNewRiders(range: AnalyticsDateRange) {
  const { startDate, endDate } = startAndEnd(range);
  const granularity = getAnalyticsBucketGranularity(range);

  const rows = await prisma.$queryRaw<BucketRow[]>(Prisma.sql`
    SELECT
      date_trunc(${granularity}, "createdAt") AS bucket,
      COUNT(*)::double precision AS value
    FROM "User"
    WHERE "role" = ${UserRole.RIDER}
      AND "isDeleted" = false
      AND "createdAt" >= ${startDate}
      AND "createdAt" <= ${endDate}
    GROUP BY bucket
    ORDER BY bucket ASC
  `);

  return buildTrendPoints(rows, granularity);
}

async function getBucketedCompletionHours(range: AnalyticsDateRange) {
  const { startDate, endDate } = startAndEnd(range);
  const granularity = getAnalyticsBucketGranularity(range);

  const rows = await prisma.$queryRaw<BucketRow[]>(Prisma.sql`
    SELECT
      date_trunc(${granularity}, "deliveredAt") AS bucket,
      AVG(EXTRACT(EPOCH FROM ("deliveredAt" - "assignedAt")) / 3600.0)::double precision AS value
    FROM "Delivery"
    WHERE "status" = 'DELIVERED'
      AND "assignedAt" IS NOT NULL
      AND "deliveredAt" IS NOT NULL
      AND "deliveredAt" >= ${startDate}
      AND "deliveredAt" <= ${endDate}
    GROUP BY bucket
    ORDER BY bucket ASC
  `);

  return buildTrendPoints(rows, granularity);
}

async function getBucketedAssignments(range: AnalyticsDateRange) {
  const { startDate, endDate } = startAndEnd(range);
  const granularity = getAnalyticsBucketGranularity(range);

  const rows = await prisma.$queryRaw<BucketRow[]>(Prisma.sql`
    SELECT
      date_trunc(${granularity}, "assignedAt") AS bucket,
      COUNT(*)::double precision AS value
    FROM "Delivery"
    WHERE "assignedAt" IS NOT NULL
      AND "assignedAt" >= ${startDate}
      AND "assignedAt" <= ${endDate}
    GROUP BY bucket
    ORDER BY bucket ASC
  `);

  return buildTrendPoints(rows, granularity);
}

async function getCountBreakdowns(range: AnalyticsDateRange) {
  const { startDate, endDate } = startAndEnd(range);
  const [deliveryStatuses, deliveryTypes, assignmentStates] = await Promise.all([
    prisma.$queryRaw<CountRow[]>(Prisma.sql`
      SELECT "Delivery"."status"::text AS key, COUNT(*) AS count
      FROM "Delivery"
      INNER JOIN "Order" ON "Order".id = "Delivery"."orderId"
      WHERE "Order"."createdAt" >= ${startDate}
        AND "Order"."createdAt" <= ${endDate}
      GROUP BY "Delivery"."status"
      ORDER BY COUNT(*) DESC
    `),
    prisma.$queryRaw<CountRow[]>(Prisma.sql`
      SELECT "Order"."deliveryType"::text AS key, COUNT(*) AS count
      FROM "Delivery"
      INNER JOIN "Order" ON "Order".id = "Delivery"."orderId"
      WHERE "Order"."createdAt" >= ${startDate}
        AND "Order"."createdAt" <= ${endDate}
      GROUP BY "Order"."deliveryType"
      ORDER BY COUNT(*) DESC
    `),
    prisma.$queryRaw<CountRow[]>(Prisma.sql`
      SELECT key, count
      FROM (
        SELECT 'ASSIGNED'::text AS key, COUNT(*) AS count
        FROM "Delivery"
        INNER JOIN "Order" ON "Order".id = "Delivery"."orderId"
        WHERE "Delivery"."riderId" IS NOT NULL
          AND "Order"."createdAt" <= ${endDate}

        UNION ALL

        SELECT 'UNASSIGNED'::text AS key, COUNT(*) AS count
        FROM "Delivery"
        INNER JOIN "Order" ON "Order".id = "Delivery"."orderId"
        WHERE "Delivery"."riderId" IS NULL
          AND "Delivery"."status" = 'PENDING_ASSIGNMENT'
          AND "Order"."createdAt" <= ${endDate}
      ) states
      ORDER BY count DESC
    `),
  ]);

  return {
    deliveryStatuses: mapCountRows(deliveryStatuses),
    deliveryTypes: mapCountRows(deliveryTypes),
    assignmentStates: mapCountRows(assignmentStates),
  };
}

async function getValueBreakdowns(range: AnalyticsDateRange) {
  const { startDate, endDate } = startAndEnd(range);
  const [
    topRidersByCompleted,
    topRidersByPayouts,
    topRidersByPendingExposure,
  ] = await Promise.all([
    prisma.$queryRaw<ValueRow[]>(Prisma.sql`
      SELECT
        u.id AS key,
        COALESCE(u.name, u.email) AS label,
        COUNT(*)::double precision AS value,
        COALESCE(SUM("Delivery"."riderPayoutAmount"), 0)::double precision AS "secondaryValue"
      FROM "Delivery"
      INNER JOIN "User" u ON u.id = "Delivery"."riderId"
      WHERE "Delivery"."riderId" IS NOT NULL
        AND "Delivery"."status" = 'DELIVERED'
        AND "Delivery"."deliveredAt" IS NOT NULL
        AND "Delivery"."deliveredAt" >= ${startDate}
        AND "Delivery"."deliveredAt" <= ${endDate}
      GROUP BY u.id, u.name, u.email
      ORDER BY value DESC, "secondaryValue" DESC
      LIMIT 8
    `),
    prisma.$queryRaw<ValueRow[]>(Prisma.sql`
      SELECT
        u.id AS key,
        COALESCE(u.name, u.email) AS label,
        COALESCE(SUM("Delivery"."riderPayoutAmount"), 0)::double precision AS value,
        COUNT(*)::double precision AS "secondaryValue"
      FROM "Delivery"
      INNER JOIN "User" u ON u.id = "Delivery"."riderId"
      WHERE "Delivery"."riderId" IS NOT NULL
        AND "Delivery"."payoutReleasedAt" IS NOT NULL
        AND "Delivery"."payoutReleasedAt" >= ${startDate}
        AND "Delivery"."payoutReleasedAt" <= ${endDate}
      GROUP BY u.id, u.name, u.email
      ORDER BY value DESC, "secondaryValue" DESC
      LIMIT 8
    `),
    prisma.$queryRaw<ValueRow[]>(Prisma.sql`
      SELECT
        u.id AS key,
        COALESCE(u.name, u.email) AS label,
        COALESCE(SUM("Delivery"."riderPayoutAmount"), 0)::double precision AS value,
        COUNT(*)::double precision AS "secondaryValue"
      FROM "Delivery"
      INNER JOIN "User" u ON u.id = "Delivery"."riderId"
      INNER JOIN "Order" o ON o.id = "Delivery"."orderId"
      WHERE "Delivery"."riderId" IS NOT NULL
        AND "Delivery"."status" = 'DELIVERED'
        AND "Delivery"."riderPayoutAmount" > 0
        AND "Delivery"."payoutReleasedAt" IS NULL
        AND o."isPaid" = true
      GROUP BY u.id, u.name, u.email
      ORDER BY value DESC, "secondaryValue" DESC
      LIMIT 8
    `),
  ]);

  return {
    topRidersByCompleted,
    topRidersByPayouts,
    topRidersByPendingExposure,
  };
}

export async function getAdminOperationsAnalytics(
  range: AnalyticsDateRange,
): Promise<OperationsAnalyticsResponse> {
  const { startDate, endDate } = startAndEnd(range);
  const previousRange = getPreviousAnalyticsDateRange(range);
  const previousStartDate = new Date(previousRange.startDate);
  const previousEndDate = new Date(previousRange.endDate);

  const [
    summary,
    previousSummary,
    deliveriesTrend,
    completedDeliveriesTrend,
    riderPayoutsTrend,
    newRidersTrend,
    completionHoursTrend,
    assignmentsTrend,
    countBreakdowns,
    valueBreakdowns,
  ] = await Promise.all([
    getSummary(startDate, endDate),
    getSummary(previousStartDate, previousEndDate),
    getBucketedDeliveries(range),
    getBucketedCompletedDeliveries(range),
    getBucketedRiderPayouts(range),
    getBucketedNewRiders(range),
    getBucketedCompletionHours(range),
    getBucketedAssignments(range),
    getCountBreakdowns(range),
    getValueBreakdowns(range),
  ]);

  return {
    range,
    summary,
    changes: {
      totalDeliveries: calculateChange(
        summary.totalDeliveries,
        previousSummary.totalDeliveries,
      ),
      completedDeliveries: calculateChange(
        summary.completedDeliveries,
        previousSummary.completedDeliveries,
      ),
      assignedDeliveries: calculateChange(
        summary.assignedDeliveries,
        previousSummary.assignedDeliveries,
      ),
      activeRiders: calculateChange(
        summary.activeRiders,
        previousSummary.activeRiders,
      ),
      riderPayoutsReleased: calculateChange(
        summary.riderPayoutsReleased,
        previousSummary.riderPayoutsReleased,
      ),
      averageCompletionHours: calculateChange(
        summary.averageCompletionHours,
        previousSummary.averageCompletionHours,
      ),
    },
    trends: {
      deliveries: deliveriesTrend,
      completedDeliveries: completedDeliveriesTrend,
      riderPayouts: riderPayoutsTrend,
      newRiders: newRidersTrend,
      completionHours: completionHoursTrend,
      assignments: assignmentsTrend,
    },
    breakdowns: {
      deliveryStatuses: countBreakdowns.deliveryStatuses,
      deliveryTypes: countBreakdowns.deliveryTypes,
      assignmentStates: countBreakdowns.assignmentStates,
      topRidersByCompleted: valueBreakdowns.topRidersByCompleted,
      topRidersByPayouts: valueBreakdowns.topRidersByPayouts,
      topRidersByPendingExposure: valueBreakdowns.topRidersByPendingExposure,
    },
  };
}
