import { CurrentUser } from "@/lib/currentUser";
import { redirect } from "next/navigation";
import CouponForm from "../_components/CouponForm";

export default async function CreateCouponPage() {
  const user = await CurrentUser();
  if (!user || user.role !== "ADMIN") redirect("/marketplace/dashboard");

  return (
    <main className="min-h-[calc(100vh-120px)] flex items-start justify-center">
      <div className="w-full max-w-3xl">
        <CouponForm mode="create" />
      </div>
    </main>
  );
}
