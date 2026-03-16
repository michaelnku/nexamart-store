import { Prisma } from "@/generated/prisma";

import { prisma } from "@/lib/prisma";

export type MarketingCampaignStatus =
  | "DRAFT"
  | "ACTIVE"
  | "SCHEDULED"
  | "ARCHIVED";

export type MarketingPlacementSlot =
  | "HOMEPAGE_FEATURED_STORES"
  | "HOMEPAGE_FEATURED_PRODUCTS"
  | "SEASONAL_CAMPAIGN_STRIP"
  | "STORE_SPOTLIGHT_ROW"
  | "RECOMMENDED_CAMPAIGN_SLOT";

export type ActiveMarketingCampaign = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  status: MarketingCampaignStatus;
  themeKey: string | null;
  accentColor: string | null;
  heroBannerId: string | null;
  startsAt: string | null;
  endsAt: string | null;
};

export type ActiveFeaturedStore = {
  id: string;
  slot: MarketingPlacementSlot;
  priority: number;
  tagLabel: string | null;
  notes: string | null;
  startsAt: string | null;
  endsAt: string | null;
  campaign: {
    id: string;
    name: string;
    slug: string;
  };
  store: {
    id: string;
    name: string;
    slug: string;
  };
};

export type ActiveFeaturedProduct = {
  id: string;
  slot: MarketingPlacementSlot;
  priority: number;
  tagLabel: string | null;
  notes: string | null;
  startsAt: string | null;
  endsAt: string | null;
  campaign: {
    id: string;
    name: string;
    slug: string;
  };
  product: {
    id: string;
    name: string;
    slug: string;
  };
  store: {
    id: string;
    name: string;
    slug: string;
  };
};

type CampaignRow = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  status: MarketingCampaignStatus;
  themeKey: string | null;
  accentColor: string | null;
  heroBannerId: string | null;
  startsAt: Date | null;
  endsAt: Date | null;
};

type FeaturedStoreRow = {
  id: string;
  slot: MarketingPlacementSlot;
  priority: number;
  tagLabel: string | null;
  notes: string | null;
  startsAt: Date | null;
  endsAt: Date | null;
  campaignId: string;
  campaignName: string;
  campaignSlug: string;
  storeId: string;
  storeName: string;
  storeSlug: string;
};

type FeaturedProductRow = {
  id: string;
  slot: MarketingPlacementSlot;
  priority: number;
  tagLabel: string | null;
  notes: string | null;
  startsAt: Date | null;
  endsAt: Date | null;
  campaignId: string;
  campaignName: string;
  campaignSlug: string;
  productId: string;
  productName: string;
  productSlug: string;
  storeId: string;
  storeName: string;
  storeSlug: string;
};

function toIsoString(value: Date | null) {
  return value?.toISOString() ?? null;
}

function slotExistsClause(
  slot: MarketingPlacementSlot | undefined,
  asOfDate: Date,
) {
  if (!slot) {
    return Prisma.empty;
  }

  return Prisma.sql`
    AND (
      EXISTS (
        SELECT 1
        FROM "FeaturedStorePlacement" fsp
        WHERE fsp."campaignId" = mc.id
          AND fsp."slot" = ${slot}
          AND fsp."isEnabled" = true
          AND (fsp."startsAt" IS NULL OR fsp."startsAt" <= ${asOfDate})
          AND (fsp."endsAt" IS NULL OR fsp."endsAt" >= ${asOfDate})
      )
      OR EXISTS (
        SELECT 1
        FROM "FeaturedProductPlacement" fpp
        WHERE fpp."campaignId" = mc.id
          AND fpp."slot" = ${slot}
          AND fpp."isEnabled" = true
          AND (fpp."startsAt" IS NULL OR fpp."startsAt" <= ${asOfDate})
          AND (fpp."endsAt" IS NULL OR fpp."endsAt" >= ${asOfDate})
      )
    )
  `;
}

export async function getActiveMarketingCampaigns(options?: {
  asOfDate?: Date;
  slot?: MarketingPlacementSlot;
}): Promise<ActiveMarketingCampaign[]> {
  const asOfDate = options?.asOfDate ?? new Date();
  const slotFilter = slotExistsClause(options?.slot, asOfDate);

  const rows = await prisma.$queryRaw<CampaignRow[]>(Prisma.sql`
    SELECT
      mc.id,
      mc.name,
      mc.slug,
      mc.description,
      mc.status,
      mc."themeKey",
      mc."accentColor",
      mc."heroBannerId",
      mc."startsAt",
      mc."endsAt"
    FROM "MarketingCampaign" mc
    WHERE mc.status = 'ACTIVE'
      AND (mc."startsAt" IS NULL OR mc."startsAt" <= ${asOfDate})
      AND (mc."endsAt" IS NULL OR mc."endsAt" >= ${asOfDate})
      ${slotFilter}
    ORDER BY mc.name ASC
  `);

  return rows.map((row) => ({
    id: row.id,
    name: row.name,
    slug: row.slug,
    description: row.description,
    status: row.status,
    themeKey: row.themeKey,
    accentColor: row.accentColor,
    heroBannerId: row.heroBannerId,
    startsAt: toIsoString(row.startsAt),
    endsAt: toIsoString(row.endsAt),
  }));
}

export async function getActiveFeaturedStores(
  slot: MarketingPlacementSlot,
  asOfDate = new Date(),
): Promise<ActiveFeaturedStore[]> {
  const rows = await prisma.$queryRaw<FeaturedStoreRow[]>(Prisma.sql`
    SELECT
      fsp.id,
      fsp.slot,
      fsp.priority,
      fsp."tagLabel",
      fsp.notes,
      fsp."startsAt",
      fsp."endsAt",
      mc.id AS "campaignId",
      mc.name AS "campaignName",
      mc.slug AS "campaignSlug",
      s.id AS "storeId",
      s.name AS "storeName",
      s.slug AS "storeSlug"
    FROM "FeaturedStorePlacement" fsp
    INNER JOIN "MarketingCampaign" mc ON mc.id = fsp."campaignId"
    INNER JOIN "Store" s ON s.id = fsp."storeId"
    WHERE fsp.slot = ${slot}
      AND fsp."isEnabled" = true
      AND mc.status = 'ACTIVE'
      AND (fsp."startsAt" IS NULL OR fsp."startsAt" <= ${asOfDate})
      AND (fsp."endsAt" IS NULL OR fsp."endsAt" >= ${asOfDate})
      AND (mc."startsAt" IS NULL OR mc."startsAt" <= ${asOfDate})
      AND (mc."endsAt" IS NULL OR mc."endsAt" >= ${asOfDate})
      AND s."isDeleted" = false
      AND s."isSuspended" = false
    ORDER BY fsp.priority ASC, fsp."createdAt" ASC
  `);

  return rows.map((row) => ({
    id: row.id,
    slot: row.slot,
    priority: row.priority,
    tagLabel: row.tagLabel,
    notes: row.notes,
    startsAt: toIsoString(row.startsAt),
    endsAt: toIsoString(row.endsAt),
    campaign: {
      id: row.campaignId,
      name: row.campaignName,
      slug: row.campaignSlug,
    },
    store: {
      id: row.storeId,
      name: row.storeName,
      slug: row.storeSlug,
    },
  }));
}

export async function getActiveFeaturedProducts(
  slot: MarketingPlacementSlot,
  asOfDate = new Date(),
): Promise<ActiveFeaturedProduct[]> {
  const rows = await prisma.$queryRaw<FeaturedProductRow[]>(Prisma.sql`
    SELECT
      fpp.id,
      fpp.slot,
      fpp.priority,
      fpp."tagLabel",
      fpp.notes,
      fpp."startsAt",
      fpp."endsAt",
      mc.id AS "campaignId",
      mc.name AS "campaignName",
      mc.slug AS "campaignSlug",
      p.id AS "productId",
      p.name AS "productName",
      p.slug AS "productSlug",
      s.id AS "storeId",
      s.name AS "storeName",
      s.slug AS "storeSlug"
    FROM "FeaturedProductPlacement" fpp
    INNER JOIN "MarketingCampaign" mc ON mc.id = fpp."campaignId"
    INNER JOIN "Product" p ON p.id = fpp."productId"
    INNER JOIN "Store" s ON s.id = p."storeId"
    WHERE fpp.slot = ${slot}
      AND fpp."isEnabled" = true
      AND mc.status = 'ACTIVE'
      AND (fpp."startsAt" IS NULL OR fpp."startsAt" <= ${asOfDate})
      AND (fpp."endsAt" IS NULL OR fpp."endsAt" >= ${asOfDate})
      AND (mc."startsAt" IS NULL OR mc."startsAt" <= ${asOfDate})
      AND (mc."endsAt" IS NULL OR mc."endsAt" >= ${asOfDate})
      AND p."isPublished" = true
      AND s."isDeleted" = false
      AND s."isSuspended" = false
    ORDER BY fpp.priority ASC, fpp."createdAt" ASC
  `);

  return rows.map((row) => ({
    id: row.id,
    slot: row.slot,
    priority: row.priority,
    tagLabel: row.tagLabel,
    notes: row.notes,
    startsAt: toIsoString(row.startsAt),
    endsAt: toIsoString(row.endsAt),
    campaign: {
      id: row.campaignId,
      name: row.campaignName,
      slug: row.campaignSlug,
    },
    product: {
      id: row.productId,
      name: row.productName,
      slug: row.productSlug,
    },
    store: {
      id: row.storeId,
      name: row.storeName,
      slug: row.storeSlug,
    },
  }));
}

export async function getActiveMarketingContentSnapshot(options?: {
  asOfDate?: Date;
  storeSlot?: MarketingPlacementSlot;
  productSlot?: MarketingPlacementSlot;
}) {
  const asOfDate = options?.asOfDate ?? new Date();
  const storeSlot = options?.storeSlot ?? "HOMEPAGE_FEATURED_STORES";
  const productSlot = options?.productSlot ?? "HOMEPAGE_FEATURED_PRODUCTS";

  const [campaigns, featuredStores, featuredProducts] = await Promise.all([
    getActiveMarketingCampaigns({ asOfDate }),
    getActiveFeaturedStores(storeSlot, asOfDate),
    getActiveFeaturedProducts(productSlot, asOfDate),
  ]);

  return {
    asOfDate: asOfDate.toISOString(),
    campaigns,
    featuredStores,
    featuredProducts,
  };
}
