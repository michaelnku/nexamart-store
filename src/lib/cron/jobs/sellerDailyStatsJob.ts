import { buildSellerDailyStats } from "@/lib/services/analytics/buildSellerDailyStats";

export async function runSellerDailyStatsJob() {
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);

  await buildSellerDailyStats(yesterday);
}
