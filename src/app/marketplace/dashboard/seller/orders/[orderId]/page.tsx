import Image from "next/image";
import Link from "next/link";

import DisputeEvidenceGallery from "@/components/disputes/DisputeEvidenceGallery";
import DisputeStatusBadge from "@/components/disputes/DisputeStatusBadge";
import DisputeSummaryCard from "@/components/disputes/DisputeSummaryCard";
import DisputeTimeline from "@/components/disputes/DisputeTimeline";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CurrentUser } from "@/lib/currentUser";
import { formatBaseUSD } from "@/lib/currency/formatBaseUSD";
import { buildDisputeTimeline } from "@/lib/disputes/ui";
import { prisma } from "@/lib/prisma";

export default async function SellerOrderDetails({
  params,
}: {
  params: Promise<{ orderId: string }>;
}) {
  const { orderId } = await params;

  const user = await CurrentUser();
  if (!user) {
    return "Unauthorized";
  }

  const order = await prisma.order.findFirst({
    where: {
      id: orderId,
      sellerGroups: {
        some: {
          sellerId: user.id,
        },
      },
    },
    include: {
      customer: true,
      delivery: {
        include: {
          rider: true,
        },
      },
      dispute: {
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
          disputeSellerGroupImpacts: {
            where: {
              sellerGroup: { sellerId: user.id },
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
      },
      orderTimelines: {
        orderBy: { createdAt: "asc" },
      },
      sellerGroups: {
        where: {
          sellerId: user.id,
        },
        include: {
          store: true,
          seller: true,
          items: {
            include: {
              product: { include: { images: true } },
              variant: true,
            },
          },
        },
      },
    },
  });

  if (!order) {
    return "Order not found";
  }

  const group = order.sellerGroups[0];
  if (!group) {
    return "Seller group not found";
  }

  const deliveryAddress = [
    order.deliveryStreet,
    order.deliveryCity,
    order.deliveryState,
    order.deliveryCountry,
    order.deliveryPostal,
  ]
    .filter((part) => Boolean(part && part.trim()))
    .join(", ");

  const dispute = order.dispute
    ? {
        id: order.dispute.id,
        orderId: order.id,
        status: order.dispute.status,
        reason: order.dispute.reason,
        description: order.dispute.description,
        resolution: order.dispute.resolution,
        refundAmount: order.dispute.refundAmount,
        createdAt: order.dispute.createdAt.toISOString(),
        updatedAt: order.dispute.updatedAt.toISOString(),
        openedByName: order.dispute.openedBy.name,
        resolvedByName: order.dispute.resolvedBy?.name ?? null,
        evidence: order.dispute.evidence.map((item) => ({
          id: item.id,
          type: item.type,
          fileUrl: item.fileUrl,
          uploadedByName: item.uploadedBy.name,
          createdAt: item.createdAt.toISOString(),
        })),
        messages: order.dispute.messages.map((item) => ({
          id: item.id,
          senderId: item.senderId,
          senderName: item.sender.name,
          message: item.message,
          createdAt: item.createdAt.toISOString(),
        })),
        sellerImpacts: order.dispute.disputeSellerGroupImpacts.map((impact) => ({
          id: impact.id,
          sellerGroupId: impact.sellerGroupId,
          refundAmount: impact.refundAmount,
          sellerName: impact.sellerGroup.seller.name,
          storeName: impact.sellerGroup.store.name,
        })),
        returnRequest: order.dispute.returnRequest
          ? {
              id: order.dispute.returnRequest.id,
              status: order.dispute.returnRequest.status,
              trackingNumber: order.dispute.returnRequest.trackingNumber,
              carrier: order.dispute.returnRequest.carrier,
              shippedAt: order.dispute.returnRequest.shippedAt?.toISOString() ?? null,
              receivedAt:
                order.dispute.returnRequest.receivedAt?.toISOString() ?? null,
            }
          : null,
      }
    : null;

  const disputeTimeline = dispute
    ? buildDisputeTimeline(
        dispute,
        order.orderTimelines.map((timeline) => ({
          id: timeline.id,
          status: timeline.status,
          message: timeline.message,
          createdAt: timeline.createdAt.toISOString(),
        })),
      )
    : [];

  return (
    <div className="mx-auto max-w-6xl space-y-10 p-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            Order #{order.id.slice(-6)}
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            Placed on {new Date(order.createdAt).toLocaleDateString()}
          </p>
          <p className="text-sm text-gray-500">
            Store: <span className="font-medium">{group.store?.name}</span>
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Badge className="px-4 py-1 text-sm capitalize">
            {group.status === "CANCELLED"
              ? "Cancelled"
              : group.status.replaceAll("_", " ")}
          </Badge>
          {dispute ? <DisputeStatusBadge status={dispute.status} /> : null}
        </div>
      </div>

      {dispute ? (
        <div className="space-y-6">
          <DisputeSummaryCard dispute={dispute} title="Seller Dispute Summary" />

          <div className="grid gap-6 lg:grid-cols-[1.15fr,0.85fr]">
            <div className="rounded-xl border bg-white p-5 shadow-sm">
              <h2 className="mb-4 text-lg font-semibold">Dispute Timeline</h2>
              <DisputeTimeline items={disputeTimeline} />
            </div>

            <div className="space-y-6">
              <DisputeEvidenceGallery evidence={dispute.evidence} />
              <div className="rounded-xl border bg-white p-5 text-sm text-muted-foreground shadow-sm">
                Seller response and evidence submission are not enabled from this
                dashboard yet. Please review the dispute details and contact support
                if additional documentation is required.
              </div>
            </div>
          </div>
        </div>
      ) : null}

      <div className="space-y-3 rounded-xl border bg-white p-5 shadow-sm">
        <h2 className="text-lg font-semibold">Buyer Information</h2>
        <p className="text-sm">{order.customer?.name}</p>
        <p className="text-sm">{order.customer?.email}</p>
        <p className="mt-2 text-sm font-medium">Delivery Address</p>
        <p className="text-sm text-gray-700">{deliveryAddress}</p>
        {order.delivery ? (
          <p className="text-sm text-gray-700">
            Delivery status: {order.delivery.status.replaceAll("_", " ")}
          </p>
        ) : null}
      </div>

      <div className="space-y-6 rounded-xl border bg-white p-5 shadow-sm">
        <h2 className="text-lg font-semibold">Items Purchased</h2>

        {group.items.map((item) => (
          <div
            key={item.id}
            className="flex gap-4 border-b pb-4 last:border-none"
          >
            <div className="relative h-24 w-24 overflow-hidden rounded-md bg-gray-100">
              <Image
                fill
                src={item.product.images[0]?.imageUrl ?? "/placeholder.png"}
                alt={item.product.name}
                className="object-cover"
              />
            </div>

            <div className="flex-1 space-y-1">
              <p className="font-medium">{item.product.name}</p>

              {item.variant ? (
                <p className="text-sm text-gray-500">
                  {item.variant.color} {item.variant.size}
                </p>
              ) : null}

              <p className="mt-1 font-semibold text-gray-900">
                {formatBaseUSD(item.price)} × {item.quantity}
              </p>
            </div>
          </div>
        ))}

        <div className="flex justify-between pt-4 text-lg font-bold">
          <span>Subtotal</span>
          <span>{formatBaseUSD(group.subtotal)}</span>
        </div>
      </div>

      {dispute ? (
        <div className="flex justify-end">
          <Link href={`/marketplace/dashboard/seller/disputes/${dispute.id}`}>
            <Button variant="outline">Open Seller Dispute View</Button>
          </Link>
        </div>
      ) : null}
    </div>
  );
}
