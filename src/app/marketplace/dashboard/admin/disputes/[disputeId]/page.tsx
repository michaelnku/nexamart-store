import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";

import { UserRole } from "@/generated/prisma";

import AdminDisputeCaseDetail from "@/app/marketplace/dashboard/admin/disputes/AdminDisputeCaseDetail";
import { DashboardHero } from "@/app/marketplace/_components/PremiumDashboard";
import { Button } from "@/components/ui/button";
import { CurrentUser } from "@/lib/currentUser";
import { getAdminDisputeById } from "@/lib/services/admin/adminDisputesService";

export default async function AdminDisputeDetailPage({
  params,
}: {
  params: Promise<{ disputeId: string }>;
}) {
  const user = await CurrentUser();

  if (!user || user.role !== UserRole.ADMIN) {
    return <p className="p-6">Unauthorized</p>;
  }

  const { disputeId } = await params;
  const dispute = await getAdminDisputeById(disputeId);

  if (!dispute) {
    notFound();
  }

  return (
    <main className="mx-auto max-w-7xl space-y-8 px-4 py-6">
      <div className="flex items-center justify-between gap-4">
        <Button asChild variant="outline" size="sm">
          <Link href="/marketplace/dashboard/admin/disputes">
            <ArrowLeft className="h-4 w-4" />
            Back to disputes
          </Link>
        </Button>
      </div>

      <DashboardHero
        eyebrow="Trust And Safety"
        title={`Dispute Case ${dispute.orderTrackingNumber ?? dispute.orderId}`}
        description="Review the full dispute case record, resolution state, and linked payout or refund context from the admin dispute workspace."
        accentClassName="bg-[linear-gradient(135deg,#111827_0%,#4c1d95_45%,#1d4ed8_100%)]"
      />

      <AdminDisputeCaseDetail dispute={dispute} showActions />
    </main>
  );
}
