import { prisma } from "@/lib/prisma";
import { CurrentUser } from "@/lib/currentUser";
import { redirect, notFound } from "next/navigation";
import CouponForm from "../_components/CouponForm";

const formatDateInput = (value?: Date | null) => {
  if (!value) return "";
  const year = value.getFullYear();
  const month = String(value.getMonth() + 1).padStart(2, "0");
  const day = String(value.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

export default async function EditCouponPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await CurrentUser();
  if (!user || user.role !== "ADMIN") redirect("/marketplace/dashboard");

  const { id } = await params;

  const coupon = await prisma.coupon.findUnique({
    where: { id },
  });

  if (!coupon) return notFound();

  return (
    <main className="min-h-[calc(100vh-120px)] flex items-start justify-center">
      <div className="w-full max-w-3xl">
        <CouponForm
          mode="edit"
          initial={{
            id: coupon.id,
            code: coupon.code,
            type: coupon.type,
            value: coupon.value,
            minOrderAmount: coupon.minOrderAmount,
            maxDiscount: coupon.maxDiscount,
            usageLimit: coupon.usageLimit,
            perUserLimit: coupon.perUserLimit,
            appliesTo: coupon.appliesTo,
            validFrom: formatDateInput(coupon.validFrom),
            validTo: formatDateInput(coupon.validTo),
            isActive: coupon.isActive,
          }}
        />
      </div>
    </main>
  );
}
