import { BannerPlacement, CouponType, Prisma } from "@/generated/prisma";

import {
  AnalyticsDateRange,
  getAnalyticsBucketGranularity,
  getPreviousAnalyticsDateRange,
} from "@/lib/analytics/date-range";
import { calculateChange } from "@/lib/analytics/format";
import { prisma } from "@/lib/prisma";
import {
  AdminMarketingCampaign,
  listAdminMarketingCampaigns,
} from "@/lib/services/admin/adminMarketingCampaignService";
import {
  AdminFeaturedProductPlacement,
  AdminFeaturedStorePlacement,
  listFeaturedProductPlacementsForCampaigns,
  listFeaturedStorePlacementsForCampaigns,
  PRODUCT_PLACEMENT_SLOT_OPTIONS,
  STORE_PLACEMENT_SLOT_OPTIONS,
  type PlacementSlotOption,
} from "@/lib/services/admin/adminMarketingPlacementService";

type TrendPoint = {
  bucket: string;
  label: string;
  value: number;
};

type BucketRow = {
  bucket: Date;
  value: number;
};

type BannerStatus = "ACTIVE" | "SCHEDULED" | "EXPIRED" | "DISABLED";

type RankedCouponRow = {
  key: string;
  label: string;
  value: number;
  secondaryValue?: number;
};

type AdminBannerRow = {
  id: string;
  title: string;
  placement: BannerPlacement;
  placementLabel: string;
  priority: number;
  startDate: string | null;
  endDate: string | null;
  isActive: boolean;
  status: BannerStatus;
};

type AdminCouponRow = {
  id: string;
  code: string;
  type: CouponType;
  value: number;
  usageCount: number;
  usageLimit: number | null;
  minOrderAmount: number | null;
  isActive: boolean;
  validFrom: string | null;
  validTo: string | null;
};

type FeaturedStoreCandidate = {
  id: string;
  label: string;
};

type FeaturedProductCandidate = {
  id: string;
  label: string;
};

type HeroBannerOption = {
  id: string;
  label: string;
};

type CouponSummary = {
  campaignConversions: number;
  revenueFromCoupons: number;
  ordersUsingCoupons: number;
};

type CouponUsageTrendRow = {
  bucket: Date;
  couponUsages: number;
};

type CouponOrdersTrendRow = {
  bucket: Date;
  ordersUsingCoupons: number;
};

export type AdminMarketingDashboardResponse = {
  range: AnalyticsDateRange;
  snapshot: {
    activeBanners: number;
    activeCoupons: number;
  };
  rangeSummary: {
    campaignConversions: number;
    revenueFromCoupons: number;
    ordersUsingCoupons: number;
    bannerClickThroughRate: number | null;
  };
  changes: {
    activeBanners: number | null;
    activeCoupons: number | null;
    campaignConversions: number | null;
    revenueFromCoupons: number | null;
    ordersUsingCoupons: number | null;
    bannerClickThroughRate: number | null;
  };
  trends: {
    couponUsage: TrendPoint[];
    bannerClickThroughRate: TrendPoint[];
    ordersUsingCoupons: TrendPoint[];
  };
  topCoupons: RankedCouponRow[];
  banners: AdminBannerRow[];
  coupons: AdminCouponRow[];
  featuredContent: {
    stores: FeaturedStoreCandidate[];
    products: FeaturedProductCandidate[];
    campaigns: AdminMarketingCampaign[];
    heroBannerOptions: HeroBannerOption[];
    storePlacementsByCampaign: Record<string, AdminFeaturedStorePlacement[]>;
    productPlacementsByCampaign: Record<string, AdminFeaturedProductPlacement[]>;
    storeSlotOptions: PlacementSlotOption[];
    productSlotOptions: PlacementSlotOption[];
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

function getBannerStatus(
  banner: {
    isActive: boolean;
    startsAt: Date | null;
    endsAt: Date | null;
  },
  now: Date,
): BannerStatus {
  if (!banner.isActive) {
    return "DISABLED";
  }

  if (banner.startsAt && banner.startsAt > now) {
    return "SCHEDULED";
  }

  if (banner.endsAt && banner.endsAt < now) {
    return "EXPIRED";
  }

  return "ACTIVE";
}

async function getActiveBannersCount(snapshotDate: Date) {
  return prisma.heroBanner.count({
    where: {
      isDeleted: false,
      isActive: true,
      OR: [{ startsAt: null }, { startsAt: { lte: snapshotDate } }],
      AND: [{ OR: [{ endsAt: null }, { endsAt: { gte: snapshotDate } }] }],
    },
  });
}

async function getActiveCouponsCount(snapshotDate: Date) {
  return prisma.coupon.count({
    where: {
      isDeleted: false,
      isActive: true,
      OR: [{ validFrom: null }, { validFrom: { lte: snapshotDate } }],
      AND: [{ OR: [{ validTo: null }, { validTo: { gte: snapshotDate } }] }],
    },
  });
}

async function getCouponSummary(startDate: Date, endDate: Date) {
  const [allPaidOrders, couponOrdersAggregate] = await Promise.all([
    prisma.order.count({
      where: {
        isPaid: true,
        createdAt: {
          gte: startDate,
          lte: endDate,
        },
      },
    }),
    prisma.order.aggregate({
      where: {
        isPaid: true,
        couponId: {
          not: null,
        },
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
  ]);

  const ordersUsingCoupons = couponOrdersAggregate._count._all ?? 0;
  const revenueFromCoupons = couponOrdersAggregate._sum.totalAmount ?? 0;

  return {
    campaignConversions:
      allPaidOrders > 0 ? (ordersUsingCoupons / allPaidOrders) * 100 : 0,
    revenueFromCoupons,
    ordersUsingCoupons,
  } satisfies CouponSummary;
}

async function getCouponUsageTrend(range: AnalyticsDateRange) {
  const { startDate, endDate } = startAndEnd(range);
  const granularity = getAnalyticsBucketGranularity(range);

  const rows = await prisma.$queryRaw<CouponUsageTrendRow[]>(Prisma.sql`
    SELECT
      date_trunc(${granularity}, cu."usedAt") AS bucket,
      COUNT(*)::double precision AS "couponUsages"
    FROM "CouponUsage" cu
    WHERE cu."usedAt" >= ${startDate}
      AND cu."usedAt" <= ${endDate}
    GROUP BY bucket
    ORDER BY bucket ASC
  `);

  return buildTrendPoints(
    rows.map((row) => ({
      bucket: row.bucket,
      value: row.couponUsages,
    })),
    granularity,
  );
}

async function getOrdersUsingCouponsTrend(range: AnalyticsDateRange) {
  const { startDate, endDate } = startAndEnd(range);
  const granularity = getAnalyticsBucketGranularity(range);

  const rows = await prisma.$queryRaw<CouponOrdersTrendRow[]>(Prisma.sql`
    SELECT
      date_trunc(${granularity}, "createdAt") AS bucket,
      COUNT(*)::double precision AS "ordersUsingCoupons"
    FROM "Order"
    WHERE "isPaid" = true
      AND "couponId" IS NOT NULL
      AND "createdAt" >= ${startDate}
      AND "createdAt" <= ${endDate}
    GROUP BY bucket
    ORDER BY bucket ASC
  `);

  return buildTrendPoints(
    rows.map((row) => ({
      bucket: row.bucket,
      value: row.ordersUsingCoupons,
    })),
    granularity,
  );
}

async function getTopCoupons(range: AnalyticsDateRange) {
  const { startDate, endDate } = startAndEnd(range);

  return prisma.$queryRaw<RankedCouponRow[]>(Prisma.sql`
    SELECT
      c.id AS key,
      c.code AS label,
      COALESCE(SUM(o."totalAmount"), 0)::double precision AS value,
      COUNT(o.id)::double precision AS "secondaryValue"
    FROM "Coupon" c
    INNER JOIN "Order" o ON o."couponId" = c.id
    WHERE o."isPaid" = true
      AND o."createdAt" >= ${startDate}
      AND o."createdAt" <= ${endDate}
    GROUP BY c.id, c.code
    ORDER BY value DESC, "secondaryValue" DESC
    LIMIT 8
  `);
}

async function getBannerRows(snapshotDate: Date) {
  const banners = await prisma.heroBanner.findMany({
    where: {
      isDeleted: false,
    },
    orderBy: [{ position: "asc" }, { createdAt: "asc" }],
    select: {
      id: true,
      title: true,
      placement: true,
      position: true,
      startsAt: true,
      endsAt: true,
      isActive: true,
    },
  });

  return banners.map((banner) => ({
    id: banner.id,
    title: banner.title?.trim() || "Untitled banner",
    placement: banner.placement,
    placementLabel: labelEnumValue(banner.placement),
    priority: banner.position,
    startDate: banner.startsAt?.toISOString() ?? null,
    endDate: banner.endsAt?.toISOString() ?? null,
    isActive: banner.isActive,
    status: getBannerStatus(banner, snapshotDate),
  }));
}

async function getCouponRows(range: AnalyticsDateRange) {
  const { startDate, endDate } = startAndEnd(range);

  const usageByCoupon = await prisma.order.groupBy({
    by: ["couponId"],
    where: {
      isPaid: true,
      couponId: {
        not: null,
      },
      createdAt: {
        gte: startDate,
        lte: endDate,
      },
    },
    _count: {
      _all: true,
    },
  });

  const usageLookup = new Map(
    usageByCoupon
      .filter((row) => row.couponId)
      .map((row) => [row.couponId as string, row._count._all ?? 0]),
  );

  const coupons = await prisma.coupon.findMany({
    where: {
      isDeleted: false,
    },
    orderBy: [{ isActive: "desc" }, { createdAt: "desc" }],
    select: {
      id: true,
      code: true,
      type: true,
      value: true,
      usageLimit: true,
      minOrderAmount: true,
      isActive: true,
      validFrom: true,
      validTo: true,
    },
    take: 16,
  });

  return coupons.map((coupon) => ({
    id: coupon.id,
    code: coupon.code,
    type: coupon.type,
    value: coupon.value,
    usageCount: usageLookup.get(coupon.id) ?? 0,
    usageLimit: coupon.usageLimit ?? null,
    minOrderAmount: coupon.minOrderAmount ?? null,
    isActive: coupon.isActive,
    validFrom: coupon.validFrom?.toISOString() ?? null,
    validTo: coupon.validTo?.toISOString() ?? null,
  }));
}

async function getFeaturedContentData(
  campaigns: AdminMarketingCampaign[],
  heroBannerOptions: HeroBannerOption[],
  storePlacementsByCampaign: Record<string, AdminFeaturedStorePlacement[]>,
  productPlacementsByCampaign: Record<string, AdminFeaturedProductPlacement[]>,
) {
  const [stores, products] = await Promise.all([
    prisma.store.findMany({
      where: {
        isDeleted: false,
        isSuspended: false,
      },
      orderBy: [{ isActive: "desc" }, { createdAt: "desc" }],
      take: 12,
      select: {
        id: true,
        name: true,
        owner: {
          select: {
            name: true,
            email: true,
          },
        },
      },
    }),
    prisma.product.findMany({
      where: {
        isPublished: true,
      },
      orderBy: [{ sold: "desc" }, { createdAt: "desc" }],
      take: 12,
      select: {
        id: true,
        name: true,
        store: {
          select: {
            name: true,
          },
        },
      },
    }),
  ]);

  return {
    stores: stores.map((store) => ({
      id: store.id,
      label: `${store.name} - ${store.owner.name ?? store.owner.email}`,
    })),
    products: products.map((product) => ({
      id: product.id,
      label: `${product.name} - ${product.store.name}`,
    })),
    campaigns,
    heroBannerOptions,
    storePlacementsByCampaign,
    productPlacementsByCampaign,
    storeSlotOptions: STORE_PLACEMENT_SLOT_OPTIONS,
    productSlotOptions: PRODUCT_PLACEMENT_SLOT_OPTIONS,
  };
}

export async function getAdminMarketingDashboard(
  range: AnalyticsDateRange,
): Promise<AdminMarketingDashboardResponse> {
  const { startDate, endDate } = startAndEnd(range);
  const previousRange = getPreviousAnalyticsDateRange(range);
  const previousStartDate = new Date(previousRange.startDate);
  const previousEndDate = new Date(previousRange.endDate);

  const [
    activeBanners,
    previousActiveBanners,
    activeCoupons,
    previousActiveCoupons,
    currentCouponSummary,
    previousCouponSummary,
    couponUsageTrend,
    ordersUsingCouponsTrend,
    topCoupons,
    banners,
    coupons,
    campaigns,
  ] = await Promise.all([
    getActiveBannersCount(endDate),
    getActiveBannersCount(previousEndDate),
    getActiveCouponsCount(endDate),
    getActiveCouponsCount(previousEndDate),
    getCouponSummary(startDate, endDate),
    getCouponSummary(previousStartDate, previousEndDate),
    getCouponUsageTrend(range),
    getOrdersUsingCouponsTrend(range),
    getTopCoupons(range),
    getBannerRows(endDate),
    getCouponRows(range),
    listAdminMarketingCampaigns({ includeArchived: true }),
  ]);

  const campaignIds = campaigns.map((campaign) => campaign.id);

  const [resolvedStorePlacementsByCampaign, resolvedProductPlacementsByCampaign] =
    campaignIds.length === 0
      ? [{}, {}]
      : await Promise.all([
          listFeaturedStorePlacementsForCampaigns(campaignIds),
          listFeaturedProductPlacementsForCampaigns(campaignIds),
        ]);

  const featuredContent = await getFeaturedContentData(
    campaigns,
    banners.map((banner) => ({
      id: banner.id,
      label: `${banner.title} - ${banner.placementLabel}`,
    })),
    resolvedStorePlacementsByCampaign,
    resolvedProductPlacementsByCampaign,
  );

  return {
    range,
    snapshot: {
      activeBanners,
      activeCoupons,
    },
    rangeSummary: {
      campaignConversions: currentCouponSummary.campaignConversions,
      revenueFromCoupons: currentCouponSummary.revenueFromCoupons,
      ordersUsingCoupons: currentCouponSummary.ordersUsingCoupons,
      // Banner impression and click tracking are not persisted in the current schema.
      bannerClickThroughRate: null,
    },
    changes: {
      activeBanners: calculateChange(activeBanners, previousActiveBanners),
      activeCoupons: calculateChange(activeCoupons, previousActiveCoupons),
      campaignConversions: calculateChange(
        currentCouponSummary.campaignConversions,
        previousCouponSummary.campaignConversions,
      ),
      revenueFromCoupons: calculateChange(
        currentCouponSummary.revenueFromCoupons,
        previousCouponSummary.revenueFromCoupons,
      ),
      ordersUsingCoupons: calculateChange(
        currentCouponSummary.ordersUsingCoupons,
        previousCouponSummary.ordersUsingCoupons,
      ),
      bannerClickThroughRate: null,
    },
    trends: {
      couponUsage: couponUsageTrend,
      bannerClickThroughRate: [],
      ordersUsingCoupons: ordersUsingCouponsTrend,
    },
    topCoupons,
    banners,
    coupons,
    featuredContent,
  };
}
