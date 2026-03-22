import { unstable_noStore as noStore } from "next/cache";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@/generated/prisma/client";
import {
  buildSqlWhere,
  createIlikePattern,
  normalizeSearchText,
  omitAllFilter,
  resolvePage,
} from "@/lib/moderation/queryHelpers";

export type ModeratorProductsFilters = {
  page?: number;
  q?: string;
  published?: "ALL" | "YES" | "NO";
  foodType?: "ALL" | "FOOD" | "GENERAL";
  flagged?: "ALL" | "YES" | "NO";
};

export const MODERATOR_PRODUCTS_PAGE_SIZE = 24;

function buildModeratorProductsWhereSql(
  filters: ModeratorProductsFilters,
  aliases = {
    product: Prisma.raw("p"),
    store: Prisma.raw("s"),
    incident: Prisma.raw("ia"),
  },
) {
  const q = normalizeSearchText(filters.q);
  const conditions: Prisma.Sql[] = [];

  const published = omitAllFilter(filters.published);
  const foodType = omitAllFilter(filters.foodType);
  const flagged = omitAllFilter(filters.flagged);

  if (published === "YES") {
    conditions.push(Prisma.sql`${aliases.product}."isPublished" = true`);
  } else if (published === "NO") {
    conditions.push(Prisma.sql`${aliases.product}."isPublished" = false`);
  }

  if (foodType === "FOOD") {
    conditions.push(Prisma.sql`${aliases.product}."isFoodProduct" = true`);
  } else if (foodType === "GENERAL") {
    conditions.push(Prisma.sql`${aliases.product}."isFoodProduct" = false`);
  }

  if (flagged === "YES") {
    conditions.push(
      Prisma.sql`COALESCE(${aliases.incident}."linkedIncidentCount", 0) > 0`,
    );
  } else if (flagged === "NO") {
    conditions.push(
      Prisma.sql`COALESCE(${aliases.incident}."linkedIncidentCount", 0) = 0`,
    );
  }

  if (q) {
    const query = createIlikePattern(q);
    conditions.push(Prisma.sql`
      (
        ${aliases.product}.id ILIKE ${query}
        OR ${aliases.product}.name ILIKE ${query}
        OR ${aliases.product}.description ILIKE ${query}
        OR ${aliases.product}.brand ILIKE ${query}
        OR ${aliases.store}.name ILIKE ${query}
        OR ${aliases.store}.slug ILIKE ${query}
      )
    `);
  }

  return buildSqlWhere(conditions);
}

function productIncidentAggregationSql() {
  return Prisma.sql`
    WITH incident_events AS (
      SELECT
        mi."targetId" AS "productId",
        mi."severity",
        mi."status"
      FROM "ModerationIncident" mi
      WHERE mi."targetType" = 'PRODUCT'

      UNION ALL

      SELECT
        pi."productId" AS "productId",
        mi."severity",
        mi."status"
      FROM "ModerationIncident" mi
      INNER JOIN "ProductImage" pi ON pi.id = mi."targetId"
      WHERE mi."targetType" = 'PRODUCT_IMAGE'
    ),
    incident_agg AS (
      SELECT
        ie."productId",
        COUNT(*)::int AS "linkedIncidentCount",
        BOOL_OR(ie."status" = 'OPEN') AS "hasOpenIncident",
        MAX(
          CASE ie."severity"
            WHEN 'CRITICAL' THEN 4
            WHEN 'HIGH' THEN 3
            WHEN 'MEDIUM' THEN 2
            WHEN 'LOW' THEN 1
            ELSE 0
          END
        )::int AS "highestSeverityRank"
      FROM incident_events ie
      GROUP BY ie."productId"
    )
  `;
}

function mapSeverityRank(rank: number | null) {
  switch (rank) {
    case 4:
      return "CRITICAL";
    case 3:
      return "HIGH";
    case 2:
      return "MEDIUM";
    case 1:
      return "LOW";
    default:
      return null;
  }
}

function highestIncidentSeverity<
  T extends { severity: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL" },
>(incidents: T[]) {
  return (
    incidents.find((item) => item.severity === "CRITICAL")?.severity ??
    incidents.find((item) => item.severity === "HIGH")?.severity ??
    incidents.find((item) => item.severity === "MEDIUM")?.severity ??
    incidents.find((item) => item.severity === "LOW")?.severity ??
    null
  );
}

export async function getModeratorProducts(filters: ModeratorProductsFilters) {
  noStore();
  const page = resolvePage(filters.page);
  const whereSql = buildModeratorProductsWhereSql(filters);

  const [{ totalItems }] = await prisma.$queryRaw<Array<{ totalItems: bigint }>>(
    Prisma.sql`
      ${productIncidentAggregationSql()}
      SELECT COUNT(*)::bigint AS "totalItems"
      FROM "Product" p
      INNER JOIN "Store" s ON s.id = p."storeId"
      LEFT JOIN incident_agg ia ON ia."productId" = p.id
      ${whereSql}
    `,
  );

  const totalItemsNumber = Number(totalItems);
  const totalPages = Math.max(
    1,
    Math.ceil(totalItemsNumber / MODERATOR_PRODUCTS_PAGE_SIZE),
  );
  const effectivePage = Math.min(page, totalPages);
  const effectiveOffset = (effectivePage - 1) * MODERATOR_PRODUCTS_PAGE_SIZE;

  const selectedProducts = await prisma.$queryRaw<
    Array<{
      id: string;
      linkedIncidentCount: number | null;
      hasOpenIncident: boolean | null;
      highestSeverityRank: number | null;
    }>
  >(Prisma.sql`
    ${productIncidentAggregationSql()}
    SELECT
      p.id,
      ia."linkedIncidentCount",
      ia."hasOpenIncident",
      ia."highestSeverityRank"
    FROM "Product" p
    INNER JOIN "Store" s ON s.id = p."storeId"
    LEFT JOIN incident_agg ia ON ia."productId" = p.id
    ${whereSql}
    ORDER BY p."updatedAt" DESC
    OFFSET ${effectiveOffset}
    LIMIT ${MODERATOR_PRODUCTS_PAGE_SIZE}
  `);
  const selectedProductIds = selectedProducts.map((product) => product.id);

  if (selectedProductIds.length === 0) {
    return {
      items: [],
      pagination: {
        page: effectivePage,
        pageSize: MODERATOR_PRODUCTS_PAGE_SIZE,
        totalItems: totalItemsNumber,
        totalPages,
        hasNextPage: effectivePage < totalPages,
        hasPreviousPage: effectivePage > 1,
      },
    };
  }

  const products = await prisma.product.findMany({
    where: {
      id: { in: selectedProductIds },
    },
    include: {
      store: {
        select: {
          id: true,
          name: true,
          slug: true,
          isActive: true,
          isSuspended: true,
          isVerified: true,
        },
      },
      images: {
        select: {
          id: true,
          imageUrl: true,
        },
        take: 1,
      },
      _count: {
        select: {
          reviews: true,
          conversations: true,
        },
      },
    },
    orderBy: [{ updatedAt: "desc" }],
  });

  const incidentSummaryByProductId = new Map(
    selectedProducts.map((product) => [
      product.id,
      {
        linkedIncidentCount: product.linkedIncidentCount ?? 0,
        hasOpenIncident: product.hasOpenIncident ?? false,
        highestSeverity: mapSeverityRank(product.highestSeverityRank),
      },
    ]),
  );

  return {
    items: products.map((product) => ({
      ...product,
      ...(incidentSummaryByProductId.get(product.id) ?? {
        linkedIncidentCount: 0,
        hasOpenIncident: false,
        highestSeverity: null,
      }),
    })),
    pagination: {
      page: effectivePage,
      pageSize: MODERATOR_PRODUCTS_PAGE_SIZE,
      totalItems: totalItemsNumber,
      totalPages,
      hasNextPage: effectivePage < totalPages,
      hasPreviousPage: effectivePage > 1,
    },
  };
}

export async function getModeratorProductsOverview(
  filters: ModeratorProductsFilters,
) {
  noStore();
  const whereSql = buildModeratorProductsWhereSql(filters);
  const [overview] = await prisma.$queryRaw<
    Array<{
      flaggedCount: bigint;
      unpublishedCount: bigint;
      openIncidentCount: bigint;
    }>
  >(Prisma.sql`
    ${productIncidentAggregationSql()}
    SELECT
      COUNT(*) FILTER (WHERE COALESCE(ia."linkedIncidentCount", 0) > 0)::bigint AS "flaggedCount",
      COUNT(*) FILTER (WHERE p."isPublished" = false)::bigint AS "unpublishedCount",
      COUNT(*) FILTER (WHERE COALESCE(ia."hasOpenIncident", false) = true)::bigint AS "openIncidentCount"
    FROM "Product" p
    INNER JOIN "Store" s ON s.id = p."storeId"
    LEFT JOIN incident_agg ia ON ia."productId" = p.id
    ${whereSql}
  `);

  return {
    flaggedCount: Number(overview?.flaggedCount ?? 0),
    unpublishedCount: Number(overview?.unpublishedCount ?? 0),
    openIncidentCount: Number(overview?.openIncidentCount ?? 0),
  };
}

export async function getModeratorProductById(productId: string) {
  const product = await prisma.product.findUnique({
    where: { id: productId },
    include: {
      store: {
        select: {
          id: true,
          name: true,
          slug: true,
          isActive: true,
          isSuspended: true,
          isVerified: true,
          userId: true,
        },
      },
      images: {
        select: {
          id: true,
          imageUrl: true,
          imageKey: true,
        },
      },
      category: {
        select: {
          id: true,
          name: true,
          slug: true,
        },
      },
      Brand: {
        select: {
          id: true,
          name: true,
          slug: true,
        },
      },
      variants: {
        select: {
          id: true,
          sku: true,
          color: true,
          size: true,
          stock: true,
          priceUSD: true,
          oldPriceUSD: true,
          discount: true,
        },
        orderBy: { stock: "asc" },
      },
      reviews: {
        select: {
          id: true,
          rating: true,
          comment: true,
          createdAt: true,
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              username: true,
            },
          },
        },
        orderBy: { createdAt: "desc" },
        take: 10,
      },
      _count: {
        select: {
          reviews: true,
          conversations: true,
          wishlistItems: true,
          orderItems: true,
        },
      },
    },
  });

  if (!product) return null;

  const productImageIds = product.images.map((image) => image.id);

  const incidentTargets: Prisma.ModerationIncidentWhereInput["OR"] = [
    {
      targetType: "PRODUCT",
      targetId: productId,
    },
  ];

  if (productImageIds.length > 0) {
    incidentTargets.push({
      targetType: "PRODUCT_IMAGE",
      targetId: { in: productImageIds },
    });
  }

  const incidents = await prisma.moderationIncident.findMany({
    where: {
      OR: incidentTargets,
    },
    include: {
      actorModerator: {
        select: {
          id: true,
          displayName: true,
          type: true,
        },
      },
      reviewerModerator: {
        select: {
          id: true,
          displayName: true,
          type: true,
        },
      },
      subjectUser: {
        select: {
          id: true,
          name: true,
          email: true,
          username: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
    take: 20,
  });

  return {
    ...product,
    incidents,
  };
}
