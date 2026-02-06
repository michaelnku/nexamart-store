import { CurrentUser } from "@/lib/currentUser";
import { redirect } from "next/navigation";
import CouponForm from "../_components/CouponForm";

export default async function CreateCouponPage() {
  const user = await CurrentUser();
  if (!user || user.role !== "ADMIN") redirect("/marketplace/dashboard");

  return (
    <main className="max-w-3xl">
      <CouponForm mode="create" />
    </main>
  );
}
