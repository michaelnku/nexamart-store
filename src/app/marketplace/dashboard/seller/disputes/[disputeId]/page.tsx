import Link from "next/link";

import DisputeEvidenceGallery from "@/components/disputes/DisputeEvidenceGallery";
import DisputeEvidenceUploadCard from "@/components/evidence/DisputeEvidenceUploadCard";
import LinkedDeliveryEvidenceCard from "@/components/evidence/LinkedDeliveryEvidenceCard";
import DisputeStatusBadge from "@/components/disputes/DisputeStatusBadge";
import DisputeSummaryCard from "@/components/disputes/DisputeSummaryCard";
import DisputeTimeline from "@/components/disputes/DisputeTimeline";
import { Button } from "@/components/ui/button";
import { CurrentUser } from "@/lib/currentUser";
import { buildDisputeTimeline, humanizeDisputeValue } from "@/lib/disputes/ui";
import {
  getDeliveryEvidenceForViewer,
  getDisputeEvidenceTimelineForViewer,
  getDisputeMessagesForViewer,
} from "@/lib/evidence/queries";
import { prisma } from "@/lib/prisma";

export default async function SellerDisputeDetailPage({
  params,
}: {
  params: Promise<{ disputeId: string }>;
}) {
  const { disputeId } = await params;
  const user = await CurrentUser();

  if (!user) {
    return <p>Unauthorized</p>;
  }

  const dispute = await prisma.dispute.findFirst({
    where: {
      id: disputeId,
      disputeSellerGroupImpacts: {
        some: {
          sellerGroup: {
            sellerId: user.id,
          },
        },
      },
    },
    include: {
      openedBy: { select: { name: true } },
      resolvedBy: { select: { name: true } },
      evidence: {
        include: {
          uploadedBy: { select: { name: true } },
        },
        orderBy: { createdAt: "asc" },
      },
      messages: {
        include: {
          sender: { select: { name: true } },
        },
        orderBy: { createdAt: "asc" },
      },
      returnRequest: true,
      order: {
        include: {
          customer: true,
          delivery: {
            include: {
              rider: true,
            },
          },
          orderTimelines: {
            orderBy: { createdAt: "asc" },
          },
        },
      },
      disputeSellerGroupImpacts: {
        where: {
          sellerGroup: {
            sellerId: user.id,
          },
        },
        include: {
          sellerGroup: {
            include: {
              seller: { select: { name: true } },
              store: { select: { name: true } },
            },
          },
        },
      },
    },
  });

  if (!dispute) {
    return <p className="p-6">Dispute not found.</p>;
  }

  const disputeEvidence = await getDisputeEvidenceTimelineForViewer({
    disputeId: dispute.id,
    viewerKind: "SELLER",
  });
  const disputeMessages = await getDisputeMessagesForViewer({
    disputeId: dispute.id,
    viewerKind: "SELLER",
  });
  const sellerGroupId = dispute.disputeSellerGroupImpacts[0]?.sellerGroupId ?? null;
  const deliveryEvidence = await getDeliveryEvidenceForViewer({
    orderId: dispute.orderId,
    sellerGroupId: sellerGroupId ?? undefined,
    viewerKind: "SELLER",
  });

  const disputeSummary = {
    id: dispute.id,
    orderId: dispute.orderId,
    status: dispute.status,
    reason: dispute.reason,
    description: dispute.description,
    resolution: dispute.resolution,
    refundAmount: dispute.refundAmount,
    createdAt: dispute.createdAt.toISOString(),
    updatedAt: dispute.updatedAt.toISOString(),
    openedByName: dispute.openedBy.name,
    resolvedByName: dispute.resolvedBy?.name ?? null,
    evidence: disputeEvidence,
    messages: disputeMessages,
    sellerImpacts: dispute.disputeSellerGroupImpacts.map((impact) => ({
      id: impact.id,
      sellerGroupId: impact.sellerGroupId,
      refundAmount: impact.refundAmount,
      sellerName: impact.sellerGroup.seller.name,
      storeName: impact.sellerGroup.store.name,
    })),
    linkedDeliveryEvidence: deliveryEvidence,
    returnRequest: dispute.returnRequest
      ? {
          id: dispute.returnRequest.id,
          status: dispute.returnRequest.status,
          trackingNumber: dispute.returnRequest.trackingNumber,
          carrier: dispute.returnRequest.carrier,
          shippedAt: dispute.returnRequest.shippedAt?.toISOString() ?? null,
          receivedAt: dispute.returnRequest.receivedAt?.toISOString() ?? null,
        }
      : null,
  };

  const timeline = buildDisputeTimeline(
    disputeSummary,
    dispute.order.orderTimelines.map((item) => ({
      id: item.id,
      status: item.status,
      message: item.message,
      createdAt: item.createdAt.toISOString(),
    })),
  );

  return (
    <main className="mx-auto max-w-7xl space-y-6 px-4 py-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">Seller Dispute Details</h1>
          <p className="text-sm text-muted-foreground">
            Order {dispute.orderId} · {dispute.order.isFoodOrder ? "Food" : "Non-food"} order
          </p>
        </div>

        <div className="flex items-center gap-2">
          <DisputeStatusBadge status={dispute.status} />
          <Link href="/marketplace/dashboard/seller/disputes">
            <Button variant="outline">Back to Disputes</Button>
          </Link>
        </div>
      </div>

      <DisputeSummaryCard dispute={disputeSummary} title="Seller Dispute Summary" />

      <div className="grid gap-6 lg:grid-cols-[1.1fr,0.9fr]">
        <div className="space-y-6">
          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
            <h2 className="mb-4 text-lg font-semibold">Complaint & History</h2>
            <DisputeTimeline items={timeline} />
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
            <h2 className="mb-3 text-lg font-semibold">Order Context</h2>
            <div className="space-y-2 text-sm">
              <p>
                Customer:{" "}
                <span className="font-medium">
                  {dispute.order.customer.name ?? dispute.order.customer.email}
                </span>
              </p>
              <p>Status: {humanizeDisputeValue(dispute.order.status)}</p>
              {dispute.order.delivery ? (
                <>
                  <p>
                    Delivery: {humanizeDisputeValue(dispute.order.delivery.status)}
                  </p>
                  <p>
                    Rider:{" "}
                    {dispute.order.delivery.rider?.name ??
                      dispute.order.delivery.rider?.email ??
                      "Unassigned"}
                  </p>
                </>
              ) : null}
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <DisputeEvidenceGallery evidence={disputeSummary.evidence} />
          <DisputeEvidenceUploadCard
            disputeId={dispute.id}
            sellerGroupId={sellerGroupId}
            visibilityOptions={["PARTIES_AND_ADMIN", "SELLER_AND_ADMIN"]}
          />
          <LinkedDeliveryEvidenceCard
            disputeId={dispute.id}
            deliveryEvidence={deliveryEvidence}
          />
        </div>
      </div>
    </main>
  );
}
