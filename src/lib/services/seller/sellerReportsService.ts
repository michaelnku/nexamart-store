import { prisma } from "@/lib/prisma";

export type SellerSalesStats = {
  revenue: number;
  orders: number;
  productsSold: number;
  previousRevenue: number;
};

export type SellerSalesBreakdownRow = {
  orderId: string;
  productName: string;
  quantity: number;
  revenue: number;
  status: string;
  date: string;
};

export type SellerSalesBreakdownResult = {
  rows: SellerSalesBreakdownRow[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
};

type StatsParams = {
  sellerId: string;
  startDate: Date;
  endDate: Date;
};

type BreakdownParams = {
  sellerId: string;
  startDate: Date;
  endDate: Date;
  search?: string;
  page?: number;
  limit?: number;
};

function buildSettledRangeWhere(
  sellerId: string,
  startDate: Date,
  endDate: Date,
) {
  return {
    sellerId,
    payoutReleasedAt: {
      not: null as null | Date,
      gte: startDate,
      lte: endDate,
    },
  };
}

export async function getSellerSalesStats({
  sellerId,
  startDate,
  endDate,
}: StatsParams): Promise<SellerSalesStats> {
  const rangeMs = endDate.getTime() - startDate.getTime();
  const previousStartDate = new Date(startDate.getTime() - rangeMs);
  const previousEndDate = startDate;

  const where = buildSettledRangeWhere(sellerId, startDate, endDate);
  const previousWhere = buildSettledRangeWhere(
    sellerId,
    previousStartDate,
    previousEndDate,
  );

  const [revenueAggregate, previousRevenueAggregate, orderGroups, productsSold] =
    await Promise.all([
      prisma.orderSellerGroup.aggregate({
        where,
        _sum: {
          sellerRevenue: true,
        },
      }),
      prisma.orderSellerGroup.aggregate({
        where: previousWhere,
        _sum: {
          sellerRevenue: true,
        },
      }),
      prisma.orderSellerGroup.groupBy({
        by: ["orderId"],
        where,
      }),
      prisma.orderItem.aggregate({
        where: {
          sellerGroup: {
            sellerId,
            payoutReleasedAt: {
              not: null,
              gte: startDate,
              lte: endDate,
            },
          },
        },
        _sum: {
          quantity: true,
        },
      }),
    ]);

  return {
    revenue: revenueAggregate._sum.sellerRevenue ?? 0,
    orders: orderGroups.length,
    productsSold: productsSold._sum.quantity ?? 0,
    previousRevenue: previousRevenueAggregate._sum.sellerRevenue ?? 0,
  };
}

export async function getSellerSalesBreakdown({
  sellerId,
  startDate,
  endDate,
  search,
  page = 1,
  limit = 10,
}: BreakdownParams): Promise<SellerSalesBreakdownResult> {
  const normalizedPage = Number.isFinite(page) ? Math.max(1, page) : 1;
  const normalizedLimit = Number.isFinite(limit)
    ? Math.min(100, Math.max(1, limit))
    : 10;
  const skip = (normalizedPage - 1) * normalizedLimit;
  const trimmedSearch = search?.trim();

  const where = {
    ...buildSettledRangeWhere(sellerId, startDate, endDate),
    ...(trimmedSearch
      ? {
          OR: [
            {
              orderId: {
                contains: trimmedSearch,
                mode: "insensitive" as const,
              },
            },
            {
              items: {
                some: {
                  product: {
                    name: {
                      contains: trimmedSearch,
                      mode: "insensitive" as const,
                    },
                  },
                },
              },
            },
          ],
        }
      : {}),
  };

  const [total, groups] = await Promise.all([
    prisma.orderSellerGroup.count({ where }),
    prisma.orderSellerGroup.findMany({
      where,
      orderBy: {
        payoutReleasedAt: "desc",
      },
      skip,
      take: normalizedLimit,
      select: {
        orderId: true,
        sellerRevenue: true,
        status: true,
        payoutReleasedAt: true,
        items: {
          select: {
            quantity: true,
            product: {
              select: {
                name: true,
              },
            },
          },
        },
      },
    }),
  ]);

  const rows: SellerSalesBreakdownRow[] = groups.map((group) => {
    const quantity = group.items.reduce((sum, item) => sum + item.quantity, 0);
    const productNames = group.items
      .map((item) => item.product.name)
      .filter((name, index, arr) => arr.indexOf(name) === index);

    const productName =
      productNames.length === 0
        ? "N/A"
        : productNames.length === 1
          ? productNames[0]
          : `${productNames[0]} +${productNames.length - 1} more`;

    return {
      orderId: group.orderId,
      productName,
      quantity,
      revenue: group.sellerRevenue,
      status: "COMPLETED",
      date: (group.payoutReleasedAt ?? endDate).toISOString(),
    };
  });

  return {
    rows,
    total,
    page: normalizedPage,
    limit: normalizedLimit,
    totalPages: Math.max(1, Math.ceil(total / normalizedLimit)),
  };
}
