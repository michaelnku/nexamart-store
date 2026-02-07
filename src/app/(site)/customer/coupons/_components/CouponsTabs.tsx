"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { CouponItem } from "@/lib/types";

type Props = {
  ready: CouponItem[];
  active: CouponItem[];
  expired: CouponItem[];
};

const formatDate = (value?: string | null) => {
  if (!value) return "No expiry";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "No expiry";
  return date.toLocaleDateString();
};

const formatType = (type: string, value: number) => {
  if (type === "PERCENTAGE") return `${value}% OFF`;
  if (type === "FIXED") return `$${value} OFF`;
  return "Free Shipping";
};

export default function CouponsTabs({ ready, active, expired }: Props) {
  const [tab, setTab] = useState<"ready" | "active" | "expired">("ready");

  const items = tab === "ready" ? ready : tab === "active" ? active : expired;

  return (
    <main>
      <div className="space-y-5">
        <div className="flex flex-wrap gap-2">
          <Button
            variant={tab === "ready" ? "default" : "outline"}
            onClick={() => setTab("ready")}
            className="rounded-full"
          >
            Ready to claim ({ready.length})
          </Button>
          <Button
            variant={tab === "active" ? "default" : "outline"}
            onClick={() => setTab("active")}
            className="rounded-full"
          >
            Active ({active.length})
          </Button>
          <Button
            variant={tab === "expired" ? "default" : "outline"}
            onClick={() => setTab("expired")}
            className="rounded-full"
          >
            Expired ({expired.length})
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
                className="rounded-xl border bg-white shadow-sm p-4 space-y-2"
              >
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
              </div>
            ))}
          </div>
        )}
      </div>

      {/*referrals */}
      <div className="" />
      <div>
        <span>
          <h2 className="">Referrals</h2>
          <p>
            Refer friends and earn rewards! Share your unique referral code and
            get discounts when your friends make their first purchase. It's a
            win-win!
          </p>
        </span>
        <div>
          <p>
            <Button variant="outline" className="mt-2">
              Copy Referral Code
            </Button>
          </p>
          <Button variant="secondary" className="mt-2">
            Generate Referral Code
          </Button>
        </div>
      </div>
    </main>
  );
}
