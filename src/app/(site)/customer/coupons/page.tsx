import { prisma } from "@/lib/prisma";
import { CurrentUserId } from "@/lib/currentUser";
import CouponsTabs from "./_components/CouponsTabs";

export default async function CouponsPage() {
  const userId = await CurrentUserId();
  if (!userId) return null;

  const now = new Date();

  const coupons = await prisma.coupon.findMany({
    where: { isDeleted: false },
    orderBy: { createdAt: "desc" },
    include: {
      couponClaims: { where: { userId }, select: { id: true } },
      couponUsages: { where: { userId }, select: { id: true } },
    },
  });

  const isValidNow = (coupon: (typeof coupons)[number]) => {
    const startsOk = !coupon.validFrom || coupon.validFrom <= now;
    const endsOk = !coupon.validTo || coupon.validTo >= now;
    return startsOk && endsOk;
  };

  const isExpired = (coupon: (typeof coupons)[number]) => {
    return (coupon.validTo && coupon.validTo < now) || !coupon.isActive;
  };

  const ready = coupons.filter(
    (c) =>
      c.isActive &&
      isValidNow(c) &&
      c.couponClaims.length === 0 &&
      c.couponUsages.length === 0,
  );

  const active = coupons.filter((c) => c.couponUsages.length > 0);

  const expired = coupons.filter(
    (c) =>
      isExpired(c) &&
      (c.couponClaims.length > 0 || c.couponUsages.length > 0),
  );

  const mapCoupon = (c: (typeof coupons)[number]) => ({
    id: c.id,
    code: c.code,
    type: c.type,
    value: c.value,
    minOrderAmount: c.minOrderAmount,
    maxDiscount: c.maxDiscount,
    perUserLimit: c.perUserLimit,
    usageLimit: c.usageLimit,
    validFrom: c.validFrom?.toISOString() ?? null,
    validTo: c.validTo?.toISOString() ?? null,
  });

  return (
    <main className="max-w-7xl mx-auto px-6 py-6 space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Coupons</h1>
        <p className="text-sm text-gray-500">
          Claim coupons and apply them at checkout.
        </p>
      </div>

      <CouponsTabs
        ready={ready.map(mapCoupon)}
        active={active.map(mapCoupon)}
        expired={expired.map(mapCoupon)}
      />
    </main>
  );
}
