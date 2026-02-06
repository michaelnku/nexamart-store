"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
import { MoreVertical, Pencil, Trash2, EyeOff, Eye } from "lucide-react";
import {
  softDeleteCouponAction,
  toggleCouponActiveAction,
  restoreCouponAction,
} from "@/actions/coupons/createCouponAction";
import { toast } from "sonner";

type CouponRow = {
  id: string;
  code: string;
  type: string;
  value: number;
  isActive: boolean;
  isDeleted: boolean;
  usedCount: number;
  usageLimit?: number | null;
  perUserLimit?: number | null;
  validFrom?: string | null;
  validTo?: string | null;
  appliesTo: string;
  orderCount: number;
  totalDiscount: number;
};

type Props = {
  coupons: CouponRow[];
};

const formatType = (type: string, value: number) => {
  if (type === "PERCENTAGE") return `${value}%`;
  if (type === "FIXED") return `$${value}`;
  return "Free Shipping";
};

const formatDate = (value?: string | null) => {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return date.toLocaleDateString();
};

export default function CouponsAdminClient({ coupons: initial }: Props) {
  const [coupons, setCoupons] = useState<CouponRow[]>(initial);

  const updateRow = (id: string, partial: Partial<CouponRow>) => {
    setCoupons((prev) =>
      prev.map((c) => (c.id === id ? { ...c, ...partial } : c)),
    );
  };

  const handleToggle = async (coupon: CouponRow) => {
    const res = await toggleCouponActiveAction(coupon.id, !coupon.isActive);
    if (res?.error) return toast.error(res.error);
    updateRow(coupon.id, { isActive: !coupon.isActive });
  };

  const handleDelete = async (coupon: CouponRow) => {
    const res = await softDeleteCouponAction(coupon.id);
    if (res?.error) return toast.error(res.error);
    updateRow(coupon.id, { isDeleted: true, isActive: false });
    toast.success("Coupon deleted");
  };

  const handleRestore = async (coupon: CouponRow) => {
    const res = await restoreCouponAction(coupon.id);
    if (res?.error) return toast.error(res.error);
    updateRow(coupon.id, { isDeleted: false });
    toast.success("Coupon restored");
  };

  return (
    <main className="space-y-6 max-w-full overflow-x-hidden py-8 px-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="md:text-3xl text-lg sm:text-xl font-bold">Coupons</h1>
          <p className="text-sm text-gray-500">
            Create, manage, and track coupon performance.
          </p>
        </div>
        <Link href="/marketplace/dashboard/admin/coupons/create">
          <Button className="bg-[var(--brand-blue)] hover:bg-[var(--brand-blue-hover)] text-white">
            Create Coupon
          </Button>
        </Link>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Coupons</CardTitle>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          <table className="w-full border text-sm">
            <thead className="bg-gray-100">
              <tr>
                <th className="p-3 border text-left">Code</th>
                <th className="p-3 border text-left">Type</th>
                <th className="p-3 border text-left">Scope</th>
                <th className="p-3 border text-left">Status</th>
                <th className="p-3 border text-left">Usage</th>
                <th className="p-3 border text-left">Orders</th>
                <th className="p-3 border text-left">Discounts</th>
                <th className="p-3 border text-left">Valid</th>
                <th className="p-3 border text-center">Actions</th>
              </tr>
            </thead>
            <tbody>
              {coupons.map((c) => (
                <tr key={c.id} className="hover:bg-gray-50">
                  <td className="p-3 border font-medium">{c.code}</td>
                  <td className="p-3 border">{formatType(c.type, c.value)}</td>
                  <td className="p-3 border">{c.appliesTo}</td>
                  <td className="p-3 border">
                    {c.isDeleted ? (
                      <span className="text-red-600">Deleted</span>
                    ) : c.isActive ? (
                      <span className="text-green-600">Active</span>
                    ) : (
                      <span className="text-gray-500">Disabled</span>
                    )}
                  </td>
                  <td className="p-3 border">
                    {c.usedCount}
                    {c.usageLimit ? ` / ${c.usageLimit}` : ""}
                  </td>
                  <td className="p-3 border">{c.orderCount}</td>
                  <td className="p-3 border">${c.totalDiscount.toFixed(2)}</td>
                  <td className="p-3 border">
                    {formatDate(c.validFrom)} - {formatDate(c.validTo)}
                  </td>
                  <td className="p-3 border text-center">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <button className="p-2 hover:bg-gray-100 rounded-full">
                          <MoreVertical size={18} />
                        </button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-44">
                        <DropdownMenuItem asChild>
                          <Link
                            className="flex items-center gap-2"
                            href={`/marketplace/dashboard/admin/coupons/${c.id}`}
                          >
                            <Pencil size={15} /> Edit
                          </Link>
                        </DropdownMenuItem>

                        {!c.isDeleted && (
                          <DropdownMenuItem
                            className="flex items-center gap-2"
                            onClick={() => handleToggle(c)}
                          >
                            {c.isActive ? (
                              <>
                                <EyeOff size={15} /> Disable
                              </>
                            ) : (
                              <>
                                <Eye size={15} /> Enable
                              </>
                            )}
                          </DropdownMenuItem>
                        )}

                        {!c.isDeleted ? (
                          <DropdownMenuItem
                            className="flex items-center gap-2 text-red-600"
                            onClick={() => handleDelete(c)}
                          >
                            <Trash2 size={15} /> Delete
                          </DropdownMenuItem>
                        ) : (
                          <DropdownMenuItem
                            className="flex items-center gap-2"
                            onClick={() => handleRestore(c)}
                          >
                            Restore
                          </DropdownMenuItem>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </td>
                </tr>
              ))}

              {coupons.length === 0 && (
                <tr>
                  <td
                    colSpan={9}
                    className="p-6 text-center text-gray-500 text-sm"
                  >
                    No coupons yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </main>
  );
}
