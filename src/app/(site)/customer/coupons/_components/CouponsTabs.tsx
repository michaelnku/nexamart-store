"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { CouponItem } from "@/lib/types";
import { claimCouponAction } from "@/actions/coupons/claimCouponAction";
import { toast } from "sonner";
import { Spinner } from "@/components/ui/spinner";

type Props = {
  ready: CouponItem[];
  active: CouponItem[];
  used: CouponItem[];
  expired: CouponItem[];
};

const formatDate = (value?: string | null) => {
  if (!value) return "No expiry";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "No expiry";
  return date.toISOString().slice(0, 10);
};

const formatType = (type: string, value: number) => {
  if (type === "PERCENTAGE") return `${value}% OFF`;
  if (type === "FIXED") return `$${value} OFF`;
  return "Free Shipping";
};

export default function CouponsTabs({ ready, active, used, expired }: Props) {
  const [tab, setTab] = useState<"ready" | "active" | "used" | "expired">(
    "ready",
  );

  const [readyItems, setReadyItems] = useState<CouponItem[]>(ready);
  const [activeItems, setActiveItems] = useState<CouponItem[]>(active);
  const [usedItems, setUsedItems] = useState<CouponItem[]>(used);
  const [expiredItems, setExpiredItems] = useState<CouponItem[]>(expired);
  const [claimingId, setClaimingId] = useState<string | null>(null);

  useEffect(() => {
    setReadyItems(ready);
    setActiveItems(active);
    setUsedItems(used);
    setExpiredItems(expired);
  }, [ready, active, used, expired]);

  const items =
    tab === "ready"
      ? readyItems
      : tab === "active"
        ? activeItems
        : tab === "used"
          ? usedItems
          : expiredItems;

  const handleClaim = async (coupon: CouponItem) => {
    setClaimingId(coupon.id);
    try {
      const res = await claimCouponAction(coupon.id);
      if (res?.error) return toast.error(res.error);

      setReadyItems((prev) => prev.filter((c) => c.id !== coupon.id));
      setActiveItems((prev) => [coupon, ...prev]);
      toast.success("Coupon claimed");
    } finally {
      setClaimingId(null);
    }
  };

  return (
    <main>
      <div className="space-y-5">
        <div className="flex flex-wrap gap-2">
          <Button
            variant={tab === "ready" ? "default" : "outline"}
            onClick={() => setTab("ready")}
            className="rounded-full"
          >
            Ready to claim ({readyItems.length})
          </Button>
          <Button
            variant={tab === "active" ? "default" : "outline"}
            onClick={() => setTab("active")}
            className="rounded-full"
          >
            Active ({activeItems.length})
          </Button>
          <Button
            variant={tab === "used" ? "default" : "outline"}
            onClick={() => setTab("used")}
            className="rounded-full"
          >
            Used ({usedItems.length})
          </Button>
          <Button
            variant={tab === "expired" ? "default" : "outline"}
            onClick={() => setTab("expired")}
            className="rounded-full"
          >
            Expired ({expiredItems.length})
          </Button>
        </div>

        {items.length === 0 ? (
          <div className="py-20 text-center text-muted-foreground">
            No coupons here yet.
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {items.map((coupon) => (
              <div
                key={coupon.id}
                className="relative rounded-xl border bg-white shadow-sm p-4 space-y-2 overflow-hidden"
              >
                {(tab === "used" || tab === "expired") && (
                  <span className="absolute left-[-48px] top-5 w-[200px] rotate-[-35deg] text-center text-xs font-bold uppercase tracking-wide text-white bg-black/80 py-1">
                    {tab === "used" ? "Used" : "Expired"}
                  </span>
                )}
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-lg">{coupon.code}</span>
                  <span className="text-xs rounded-full bg-blue-50 text-blue-700 px-2 py-1">
                    {formatType(coupon.type, coupon.value)}
                  </span>
                </div>

                <div className="text-xs text-gray-500 space-y-1">
                  {coupon.minOrderAmount ? (
                    <p>Min order: ${coupon.minOrderAmount}</p>
                  ) : null}
                  {coupon.maxDiscount ? (
                    <p>Max discount: ${coupon.maxDiscount}</p>
                  ) : null}
                  {coupon.perUserLimit ? (
                    <p>Per user limit: {coupon.perUserLimit}</p>
                  ) : null}
                  {coupon.usageLimit ? (
                    <p>Usage limit: {coupon.usageLimit}</p>
                  ) : null}
                  <p>Valid to: {formatDate(coupon.validTo)}</p>
                </div>

                {tab === "ready" && (
                  <Button
                    size="sm"
                    disabled={claimingId === coupon.id}
                    onClick={() => handleClaim(coupon)}
                    className="bg-[var(--brand-blue)] hover:bg-[var(--brand-blue-hover)] text-white"
                  >
                    {claimingId === coupon.id ? <Spinner /> : "Claim"}
                  </Button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
