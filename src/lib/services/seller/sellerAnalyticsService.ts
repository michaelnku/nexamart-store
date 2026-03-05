import { prisma } from "@/lib/prisma";

export async function getSellerAnalytics({
  sellerId,
  startDate,
  endDate,
}: {
  sellerId: string;
  startDate: Date;
  endDate: Date;
}) {
  const stats = await prisma.sellerDailyStats.findMany({
    where: {
      sellerId,
      date: {
        gte: startDate,
        lte: endDate,
      },
    },
    orderBy: {
      date: "asc",
    },
  });

  return stats;
}
