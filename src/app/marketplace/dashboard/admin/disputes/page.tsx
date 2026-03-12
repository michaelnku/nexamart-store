import AdminDisputesClient from "@/app/marketplace/dashboard/admin/disputes/AdminDisputesClient";
import { CurrentRole } from "@/lib/currentUser";
import { AdminDisputeDetailDTO } from "@/lib/types";
import { prisma } from "@/lib/prisma";

export default async function AdminDisputesPage() {
  const role = await CurrentRole();
  if (role !== "ADMIN") {
    return <p className="p-6">Unauthorized</p>;
  }

  const disputes = await prisma.dispute.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      openedBy: {
        select: { name: true },
      },
      resolvedBy: {
        select: { name: true },
      },
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
        include: {
          sellerGroup: {
            include: {
              seller: {
                select: { id: true, name: true },
              },
              store: {
                select: { name: true },
              },
            },
          },
        },
      },
    },
  });

  const disputeItems: AdminDisputeDetailDTO[] = disputes.map((dispute) => ({
    id: dispute.id,
    orderId: dispute.orderId,
    status: dispute.status,
    reason: dispute.reason,
    resolution: dispute.resolution,
    description: dispute.description,
    refundAmount: dispute.refundAmount,
    createdAt: dispute.createdAt.toISOString(),
    updatedAt: dispute.updatedAt.toISOString(),
    isFoodOrder: dispute.order.isFoodOrder,
    customer: {
      id: dispute.order.customer.id,
      name: dispute.order.customer.name,
      email: dispute.order.customer.email,
    },
    sellers: dispute.disputeSellerGroupImpacts.map((impact) => ({
      sellerId: impact.sellerGroup.seller.id,
      sellerName: impact.sellerGroup.seller.name,
      storeName: impact.sellerGroup.store.name,
      sellerGroupId: impact.sellerGroupId,
      refundAmount: impact.refundAmount,
      payoutLocked: impact.sellerGroup.payoutLocked,
      payoutStatus: impact.sellerGroup.payoutStatus,
      payoutReleasedAt: impact.sellerGroup.payoutReleasedAt?.toISOString() ?? null,
    })),
    delivery: dispute.order.delivery
      ? {
          id: dispute.order.delivery.id,
          status: dispute.order.delivery.status,
          riderId: dispute.order.delivery.riderId,
          riderName: dispute.order.delivery.rider?.name ?? null,
          riderEmail: dispute.order.delivery.rider?.email ?? null,
          deliveredAt: dispute.order.delivery.deliveredAt?.toISOString() ?? null,
          payoutLocked: dispute.order.delivery.payoutLocked,
          payoutReleasedAt:
            dispute.order.delivery.payoutReleasedAt?.toISOString() ?? null,
        }
      : null,
    evidence: dispute.evidence.map((item) => ({
      id: item.id,
      type: item.type,
      fileUrl: item.fileUrl,
      uploadedByName: item.uploadedBy.name,
      createdAt: item.createdAt.toISOString(),
    })),
    messages: dispute.messages.map((item) => ({
      id: item.id,
      senderId: item.senderId,
      senderName: item.sender.name,
      message: item.message,
      createdAt: item.createdAt.toISOString(),
    })),
    sellerImpacts: dispute.disputeSellerGroupImpacts.map((impact) => ({
      id: impact.id,
      sellerGroupId: impact.sellerGroupId,
      refundAmount: impact.refundAmount,
      sellerName: impact.sellerGroup.seller.name,
      storeName: impact.sellerGroup.store.name,
    })),
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
    orderTimelines: dispute.order.orderTimelines.map((item) => ({
      id: item.id,
      status: item.status,
      message: item.message,
      createdAt: item.createdAt.toISOString(),
    })),
    totalAmount: dispute.order.totalAmount,
  }));

  return (
    <main className="mx-auto max-w-7xl space-y-6 px-4 py-6">
      <div>
        <h1 className="text-2xl font-semibold">Disputes</h1>
        <p className="text-sm text-muted-foreground">
          Review, filter, and resolve marketplace disputes.
        </p>
      </div>

      <AdminDisputesClient disputes={disputeItems} />
    </main>
  );
}
