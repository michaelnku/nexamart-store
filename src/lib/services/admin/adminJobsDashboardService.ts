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

type RankedBreakdown = {
  key: string;
  label: string;
  value: number;
  secondaryValue?: number;
};

type JobTableRow = {
  id: string;
  type: string;
  status: string;
  attempts: number;
  maxRetries: number;
  runAt: string;
  createdAt: string;
  lastError: string | null;
};

export type AdminJobsDashboardResponse = {
  range: AnalyticsDateRange;
  snapshot: {
    totalJobs: number;
    pendingJobs: number;
    runningJobs: number;
    completedJobs: number;
    failedJobs: number;
    overdueJobs: number;
    retryingJobs: number;
  };
  rangeSummary: {
    jobsCreated: number;
    jobsScheduled: number;
    failedJobs: number;
    retryingJobs: number;
  };
  changes: {
    jobsCreated: number | null;
    jobsScheduled: number | null;
    failedJobs: number | null;
    retryingJobs: number | null;
  };
  trends: {
    jobsCreated: TrendPoint[];
    jobsScheduled: TrendPoint[];
    failedJobs: TrendPoint[];
  };
  breakdowns: {
    jobsByStatus: CountBreakdown[];
    jobsByType: CountBreakdown[];
    failureHotspots: RankedBreakdown[];
    retryHotspots: RankedBreakdown[];
  };
  tables: {
    recentJobs: JobTableRow[];
    failedJobs: JobTableRow[];
    retryQueue: JobTableRow[];
  };
};

const PENDING_STATUSES = new Set(["PENDING", "QUEUED"]);
const RUNNING_STATUSES = new Set(["RUNNING", "PROCESSING", "IN_PROGRESS"]);
const COMPLETED_STATUSES = new Set(["COMPLETED", "SUCCESS", "DONE"]);
const FAILED_STATUSES = new Set(["FAILED", "DEAD"]);
const RETRYING_STATUSES = new Set(["RETRYING"]);

function normalizeJobStatus(value: string | null | undefined) {
  return (value ?? "UNKNOWN").trim().toUpperCase();
}

function labelEnumValue(value: string | null | undefined) {
  const normalized = normalizeJobStatus(value);

  return normalized
    .toLowerCase()
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
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

function mapStatusRows(
  rows: Array<{ status: string; count: number }>,
): CountBreakdown[] {
  return rows.map((row) => ({
    key: row.status,
    label: labelEnumValue(row.status),
    count: row.count,
  }));
}

function classifySnapshotStatus(status: string) {
  if (PENDING_STATUSES.has(status)) return "pending";
  if (RUNNING_STATUSES.has(status)) return "running";
  if (COMPLETED_STATUSES.has(status)) return "completed";
  if (FAILED_STATUSES.has(status)) return "failed";
  if (RETRYING_STATUSES.has(status)) return "retrying";
  return "other";
}

async function getSnapshotSummary(snapshotDate: Date) {
  const [statusGroups, overdueJobs] = await Promise.all([
    prisma.job.groupBy({
      by: ["status"],
      _count: { _all: true },
    }),
    prisma.job.count({
      where: {
        runAt: { lt: snapshotDate },
        status: {
          in: [...PENDING_STATUSES, ...RETRYING_STATUSES],
        },
      },
    }),
  ]);

  let totalJobs = 0;
  let pendingJobs = 0;
  let runningJobs = 0;
  let completedJobs = 0;
  let failedJobs = 0;
  let retryingJobs = 0;

  for (const row of statusGroups) {
    const normalized = normalizeJobStatus(row.status);
    const count = row._count._all;

    totalJobs += count;

    switch (classifySnapshotStatus(normalized)) {
      case "pending":
        pendingJobs += count;
        break;
      case "running":
        runningJobs += count;
        break;
      case "completed":
        completedJobs += count;
        break;
      case "failed":
        failedJobs += count;
        break;
      case "retrying":
        retryingJobs += count;
        break;
      default:
        break;
    }
  }

  return {
    totalJobs,
    pendingJobs,
    runningJobs,
    completedJobs,
    failedJobs,
    overdueJobs,
    retryingJobs,
  };
}

async function getRangeSummary(startDate: Date, endDate: Date) {
  const [jobsCreated, jobsScheduled, failedJobs, retryingJobs] =
    await Promise.all([
      prisma.job.count({
        where: {
          createdAt: {
            gte: startDate,
            lte: endDate,
          },
        },
      }),
      prisma.job.count({
        where: {
          runAt: {
            gte: startDate,
            lte: endDate,
          },
        },
      }),
      prisma.job.count({
        where: {
          createdAt: {
            gte: startDate,
            lte: endDate,
          },
          status: {
            in: [...FAILED_STATUSES],
          },
        },
      }),
      prisma.job.count({
        where: {
          createdAt: {
            gte: startDate,
            lte: endDate,
          },
          status: {
            in: [...RETRYING_STATUSES],
          },
        },
      }),
    ]);

  return {
    jobsCreated,
    jobsScheduled,
    failedJobs,
    retryingJobs,
  };
}

async function getBucketedCreatedJobs(range: AnalyticsDateRange) {
  const { startDate, endDate } = startAndEnd(range);
  const granularity = getAnalyticsBucketGranularity(range);

  const rows = await prisma.$queryRaw<BucketRow[]>(Prisma.sql`
    SELECT
      date_trunc(${granularity}, "createdAt") AS bucket,
      COUNT(*)::double precision AS value
    FROM "Job"
    WHERE "createdAt" >= ${startDate}
      AND "createdAt" <= ${endDate}
    GROUP BY bucket
    ORDER BY bucket ASC
  `);

  return buildTrendPoints(rows, granularity);
}

async function getBucketedScheduledJobs(range: AnalyticsDateRange) {
  const { startDate, endDate } = startAndEnd(range);
  const granularity = getAnalyticsBucketGranularity(range);

  const rows = await prisma.$queryRaw<BucketRow[]>(Prisma.sql`
    SELECT
      date_trunc(${granularity}, "runAt") AS bucket,
      COUNT(*)::double precision AS value
    FROM "Job"
    WHERE "runAt" >= ${startDate}
      AND "runAt" <= ${endDate}
    GROUP BY bucket
    ORDER BY bucket ASC
  `);

  return buildTrendPoints(rows, granularity);
}

async function getBucketedFailedJobs(range: AnalyticsDateRange) {
  const { startDate, endDate } = startAndEnd(range);
  const granularity = getAnalyticsBucketGranularity(range);

  const rows = await prisma.$queryRaw<BucketRow[]>(Prisma.sql`
    SELECT
      date_trunc(${granularity}, "createdAt") AS bucket,
      COUNT(*)::double precision AS value
    FROM "Job"
    WHERE "createdAt" >= ${startDate}
      AND "createdAt" <= ${endDate}
      AND UPPER("status") IN ('FAILED', 'DEAD')
    GROUP BY bucket
    ORDER BY bucket ASC
  `);

  return buildTrendPoints(rows, granularity);
}

async function getBreakdowns(range: AnalyticsDateRange) {
  const { startDate, endDate } = startAndEnd(range);

  const [statusRows, typeRows, failureHotspots, retryHotspots] =
    await Promise.all([
      prisma.$queryRaw<Array<{ status: string; count: number }>>(Prisma.sql`
        SELECT
          UPPER("status") AS status,
          COUNT(*)::int AS count
        FROM "Job"
        GROUP BY UPPER("status")
        ORDER BY count DESC
      `),
      prisma.$queryRaw<
        Array<{ key: string; label: string; count: number }>
      >(Prisma.sql`
        SELECT
          "type" AS key,
          "type" AS label,
          COUNT(*)::int AS count
        FROM "Job"
        WHERE "createdAt" >= ${startDate}
          AND "createdAt" <= ${endDate}
        GROUP BY "type"
        ORDER BY count DESC
        LIMIT 10
      `),
      prisma.$queryRaw<RankedBreakdown[]>(Prisma.sql`
        SELECT
          "type" AS key,
          "type" AS label,
          COUNT(*)::double precision AS value,
          COALESCE(SUM("attempts"), 0)::double precision AS "secondaryValue"
        FROM "Job"
        WHERE UPPER("status") IN ('FAILED', 'DEAD')
        GROUP BY "type"
        ORDER BY value DESC, "secondaryValue" DESC
        LIMIT 8
      `),
      prisma.$queryRaw<RankedBreakdown[]>(Prisma.sql`
        SELECT
          "type" AS key,
          "type" AS label,
          COUNT(*)::double precision AS value,
          COALESCE(AVG("attempts"), 0)::double precision AS "secondaryValue"
        FROM "Job"
        WHERE UPPER("status") IN ('RETRYING')
           OR "attempts" > 1
        GROUP BY "type"
        ORDER BY value DESC, "secondaryValue" DESC
        LIMIT 8
      `),
    ]);

  return {
    jobsByStatus: mapStatusRows(statusRows),
    jobsByType: typeRows.map((row) => ({
      key: row.key,
      label: row.label,
      count: row.count,
    })),
    failureHotspots,
    retryHotspots,
  };
}

async function getTables(snapshotDate: Date) {
  const [recentJobs, failedJobs, retryQueue] = await Promise.all([
    prisma.job.findMany({
      orderBy: { createdAt: "desc" },
      take: 20,
    }),
    prisma.job.findMany({
      where: {
        status: {
          in: [...FAILED_STATUSES],
        },
      },
      orderBy: { createdAt: "desc" },
      take: 20,
    }),
    prisma.job.findMany({
      where: {
        OR: [
          { status: { in: [...RETRYING_STATUSES] } },
          {
            status: { in: [...PENDING_STATUSES] },
            attempts: { gt: 0 },
          },
        ],
      },
      orderBy: [{ runAt: "asc" }, { createdAt: "desc" }],
      take: 20,
    }),
  ]);

  const mapRow = (job: {
    id: string;
    type: string;
    status: string;
    attempts: number;
    maxRetries: number;
    runAt: Date;
    createdAt: Date;
    lastError: string | null;
  }): JobTableRow => ({
    id: job.id,
    type: job.type,
    status: normalizeJobStatus(job.status),
    attempts: job.attempts,
    maxRetries: job.maxRetries,
    runAt: job.runAt.toISOString(),
    createdAt: job.createdAt.toISOString(),
    lastError: job.lastError,
  });

  void snapshotDate;

  return {
    recentJobs: recentJobs.map(mapRow),
    failedJobs: failedJobs.map(mapRow),
    retryQueue: retryQueue.map(mapRow),
  };
}

export async function getAdminJobsDashboard(
  range: AnalyticsDateRange,
): Promise<AdminJobsDashboardResponse> {
  const snapshotDate = new Date();
  const previousRange = getPreviousAnalyticsDateRange(range);
  const previousStartDate = new Date(previousRange.startDate);
  const previousEndDate = new Date(previousRange.endDate);

  const [
    snapshot,
    rangeSummary,
    previousRangeSummary,
    jobsCreatedTrend,
    jobsScheduledTrend,
    failedJobsTrend,
    breakdowns,
    tables,
  ] = await Promise.all([
    getSnapshotSummary(snapshotDate),
    getRangeSummary(new Date(range.startDate), new Date(range.endDate)),
    getRangeSummary(previousStartDate, previousEndDate),
    getBucketedCreatedJobs(range),
    getBucketedScheduledJobs(range),
    getBucketedFailedJobs(range),
    getBreakdowns(range),
    getTables(snapshotDate),
  ]);

  return {
    range,
    snapshot,
    rangeSummary,
    changes: {
      jobsCreated: calculateChange(
        rangeSummary.jobsCreated,
        previousRangeSummary.jobsCreated,
      ),
      jobsScheduled: calculateChange(
        rangeSummary.jobsScheduled,
        previousRangeSummary.jobsScheduled,
      ),
      failedJobs: calculateChange(
        rangeSummary.failedJobs,
        previousRangeSummary.failedJobs,
      ),
      retryingJobs: calculateChange(
        rangeSummary.retryingJobs,
        previousRangeSummary.retryingJobs,
      ),
    },
    trends: {
      jobsCreated: jobsCreatedTrend,
      jobsScheduled: jobsScheduledTrend,
      failedJobs: failedJobsTrend,
    },
    breakdowns,
    tables,
  };
}
