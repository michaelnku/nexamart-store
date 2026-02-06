import { prisma } from "@/lib/prisma";
import { CurrentUser } from "@/lib/currentUser";
import { redirect } from "next/navigation";
import CouponsAdminClient from "./_components/CouponsAdminClient";

export default async function CouponsAdminPage() {
  const user = await CurrentUser();
  if (!user || user.role !== "ADMIN") redirect("/marketplace/dashboard");

  const [coupons, orderStats] = await Promise.all([
    prisma.coupon.findMany({
      orderBy: { createdAt: "desc" },
    }),
    prisma.order.groupBy({
      by: ["couponId"],
      _sum: { discountAmount: true },
      _count: { _all: true },
      where: { couponId: { not: null } },
    }),
  ]);

  const statsMap = new Map(
    orderStats.map((s) => [
      s.couponId!,
      { orderCount: s._count._all, totalDiscount: s._sum.discountAmount ?? 0 },
    ]),
  );

  const rows = coupons.map((c) => {
    const stats = statsMap.get(c.id);
    return {
      id: c.id,
      code: c.code,
      type: c.type,
      value: c.value,
      isActive: c.isActive,
      isDeleted: c.isDeleted,
      usedCount: c.usedCount,
      usageLimit: c.usageLimit,
      perUserLimit: c.perUserLimit,
      validFrom: c.validFrom?.toISOString() ?? null,
      validTo: c.validTo?.toISOString() ?? null,
      appliesTo: c.appliesTo,
      orderCount: stats?.orderCount ?? 0,
      totalDiscount: stats?.totalDiscount ?? 0,
    };
  });

  return <CouponsAdminClient coupons={rows} />;
}
