import { prisma } from "@/lib/prisma";

export async function buildSellerDailyStats(date: Date) {
  const start = new Date(date);
  start.setUTCHours(0, 0, 0, 0);

  const end = new Date(date);
  end.setUTCHours(23, 59, 59, 999);

  /**
   * STEP 1
   * Find sellers with payouts that day
   */

  const sellers = await prisma.orderSellerGroup.findMany({
    where: {
      payoutReleasedAt: {
        gte: start,
        lte: end,
      },
    },
    select: {
      sellerId: true,
    },
    distinct: ["sellerId"],
  });

  /**
   * STEP 2
   * Aggregate stats per seller
   */

  for (const { sellerId } of sellers) {
    const [revenueAgg, ordersAgg, productsAgg] = await Promise.all([
      prisma.orderSellerGroup.aggregate({
        where: {
          sellerId,
          payoutReleasedAt: {
            gte: start,
            lte: end,
          },
        },
        _sum: {
          sellerRevenue: true,
        },
      }),

      prisma.orderSellerGroup.groupBy({
        by: ["orderId"],
        where: {
          sellerId,
          payoutReleasedAt: {
            gte: start,
            lte: end,
          },
        },
      }),

      prisma.orderItem.aggregate({
        where: {
          sellerGroup: {
            sellerId,
            payoutReleasedAt: {
              gte: start,
              lte: end,
            },
          },
        },
        _sum: {
          quantity: true,
        },
      }),
    ]);

    const revenue = revenueAgg._sum.sellerRevenue ?? 0;
    const orders = ordersAgg.length;
    const productsSold = productsAgg._sum.quantity ?? 0;

    await prisma.sellerDailyStats.upsert({
      where: {
        sellerId_date: {
          sellerId,
          date: start,
        },
      },
      update: {
        revenue,
        orders,
        productsSold,
      },
      create: {
        sellerId,
        date: start,
        revenue,
        orders,
        productsSold,
      },
    });
  }
}
