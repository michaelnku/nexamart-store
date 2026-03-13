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

const styles = {
  section: "mx-auto max-w-6xl space-y-8 px-4 py-6",
  premiumSurface:
    "rounded-2xl border border-slate-200/80 bg-white shadow-[0_22px_60px_-40px_rgba(15,23,42,0.35)] dark:border-zinc-800 dark:bg-zinc-950",
  tintedSurface:
    "rounded-xl border border-slate-200/70 bg-slate-50/80 dark:border-zinc-800 dark:bg-zinc-900/70",
  eyebrow:
    "inline-flex w-fit items-center rounded-full border border-[#3c9ee0]/15 bg-[#3c9ee0]/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.2em] text-[#2c7fb8] dark:border-[#3c9ee0]/25 dark:bg-[#3c9ee0]/12 dark:text-[#7fc6f5]",
  token:
    "inline-flex items-center rounded-full border border-slate-200 bg-white px-2.5 py-1 text-[11px] font-semibold tracking-[0.18em] text-slate-600 shadow-sm dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-300",
  metaLabel:
    "text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-400 dark:text-zinc-500",
  statusBadge:
    "inline-flex items-center rounded-full border border-slate-200 bg-white px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-700 shadow-sm dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-200",
  secondaryAction:
    "h-10 rounded-xl border border-slate-200 bg-white px-4 text-slate-700 shadow-sm transition hover:border-[#3c9ee0]/35 hover:bg-[#3c9ee0]/[0.06] hover:text-[#256fa6] dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-200 dark:hover:border-[#3c9ee0]/45 dark:hover:bg-[#3c9ee0]/10 dark:hover:text-[#72bdf0]",
};

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
        sellerImpacts: order.dispute.disputeSellerGroupImpacts.map(
          (impact) => ({
            id: impact.id,
            sellerGroupId: impact.sellerGroupId,
            refundAmount: impact.refundAmount,
            sellerName: impact.sellerGroup.seller.name,
            storeName: impact.sellerGroup.store.name,
          }),
        ),
        returnRequest: order.dispute.returnRequest
          ? {
              id: order.dispute.returnRequest.id,
              status: order.dispute.returnRequest.status,
              trackingNumber: order.dispute.returnRequest.trackingNumber,
              carrier: order.dispute.returnRequest.carrier,
              shippedAt:
                order.dispute.returnRequest.shippedAt?.toISOString() ?? null,
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
    <div className={styles.section}>
      <section className={`${styles.premiumSurface} overflow-hidden`}>
        <div className="border-b border-slate-200/80 bg-[linear-gradient(180deg,rgba(60,158,224,0.08),rgba(255,255,255,0.96))] px-6 py-5 dark:border-zinc-800 dark:bg-[linear-gradient(180deg,rgba(60,158,224,0.12),rgba(24,24,27,0.96))]">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div className="space-y-3">
              <span className={styles.eyebrow}>Seller Order Detail</span>
              <div className="space-y-2">
                <div className="flex flex-wrap items-center gap-3">
                  <h1 className="text-2xl font-bold tracking-tight text-slate-950 dark:text-zinc-100">
                    Order Detail
                  </h1>
                  <span className={styles.token}>#{order.id.slice(-6)}</span>
                </div>
                <p className="text-sm text-slate-500 dark:text-zinc-400">
                  Placed on {new Date(order.createdAt).toLocaleDateString()} for{" "}
                  <span className="font-medium text-slate-700 dark:text-zinc-200">
                    {group.store?.name}
                  </span>
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <Badge className={styles.statusBadge}>
                {group.status === "CANCELLED"
                  ? "Cancelled"
                  : group.status.replaceAll("_", " ")}
              </Badge>
              {dispute ? <DisputeStatusBadge status={dispute.status} /> : null}
            </div>
          </div>
        </div>

        <div className="grid gap-4 p-6 md:grid-cols-3">
          <div className={`${styles.tintedSurface} p-4`}>
            <p className={styles.metaLabel}>Store</p>
            <p className="mt-1 text-sm font-semibold text-slate-900 dark:text-zinc-100">
              {group.store?.name}
            </p>
          </div>
          <div className={`${styles.tintedSurface} p-4`}>
            <p className={styles.metaLabel}>Customer</p>
            <p className="mt-1 text-sm font-semibold text-slate-900 dark:text-zinc-100">
              {order.customer?.name ?? "-"}
            </p>
          </div>
          <div className={`${styles.tintedSurface} p-4`}>
            <p className={styles.metaLabel}>Subtotal</p>
            <p className="mt-1 text-lg font-bold tracking-tight text-[var(--brand-blue)]">
              {formatBaseUSD(group.subtotal)}
            </p>
          </div>
        </div>
      </section>

      <div className="grid gap-6 lg:grid-cols-[0.95fr,1.05fr]">
        <div className={`${styles.premiumSurface} p-5`}>
          <h2 className="mb-4 text-lg font-semibold text-slate-950 dark:text-zinc-100">
            Customer Information
          </h2>
          <div className="space-y-4">
            <div className={`${styles.tintedSurface} p-4`}>
              <p className={styles.metaLabel}>Customer</p>
              <p className="mt-1 text-sm font-semibold text-slate-900 dark:text-zinc-100">
                {order.customer?.name}
              </p>
              <p className="mt-1 text-sm text-slate-500 dark:text-zinc-400">
                {order.customer?.email}
              </p>
            </div>

            <div className={`${styles.tintedSurface} p-4`}>
              <p className={styles.metaLabel}>Delivery Address</p>
              <p className="mt-1 text-sm text-gray-700 dark:text-zinc-300">
                {deliveryAddress}
              </p>
            </div>

            {order.delivery ? (
              <div className={`${styles.tintedSurface} p-4`}>
                <p className={styles.metaLabel}>Delivery Status</p>
                <p className="mt-1 text-sm font-medium text-gray-700 dark:text-zinc-300">
                  {order.delivery.status.replaceAll("_", " ")}
                </p>
              </div>
            ) : null}
          </div>
        </div>

        <div className={`${styles.premiumSurface} p-5`}>
          <div className="mb-4 flex items-center justify-between gap-3">
            <h2 className="text-lg font-semibold text-slate-950 dark:text-zinc-100">
              Items Purchased
            </h2>
            <span className={styles.token}>
              {group.items.length} item{group.items.length === 1 ? "" : "s"}
            </span>
          </div>

          <div className="space-y-4">
            {group.items.map((item) => (
              <div
                key={item.id}
                className={`${styles.tintedSurface} flex gap-4 p-4`}
              >
                <div className="relative h-24 w-24 shrink-0 overflow-hidden rounded-xl bg-gray-100 dark:bg-zinc-800">
                  <Image
                    fill
                    src={item.product.images[0]?.imageUrl ?? "/placeholder.png"}
                    alt={item.product.name}
                    className="object-cover"
                  />
                </div>

                <div className="min-w-0 flex-1 space-y-2">
                  <p className="font-semibold text-slate-900 dark:text-zinc-100">
                    {item.product.name}
                  </p>

                  {item.variant ? (
                    <p className="text-sm text-gray-500 dark:text-zinc-400">
                      {item.variant.color} {item.variant.size}
                    </p>
                  ) : null}

                  <p className="text-sm font-semibold text-slate-800 dark:text-zinc-200">
                    {formatBaseUSD(item.price)} × {item.quantity}
                  </p>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-6 flex items-center justify-between border-t border-slate-200 pt-4 text-lg font-bold dark:border-zinc-800">
            <span className="text-slate-800 dark:text-zinc-200">Subtotal</span>
            <span className="text-[var(--brand-blue)]">
              {formatBaseUSD(group.subtotal)}
            </span>
          </div>
        </div>
      </div>

      {dispute ? (
        <div className="space-y-6">
          <DisputeSummaryCard
            dispute={dispute}
            title="Seller Dispute Summary"
          />

          <div className="grid gap-6 lg:grid-cols-[1.15fr,0.85fr]">
            <div className={`${styles.premiumSurface} p-5`}>
              <h2 className="mb-4 text-lg font-semibold text-slate-950 dark:text-zinc-100">
                Dispute Timeline
              </h2>
              <DisputeTimeline items={disputeTimeline} />
            </div>

            <div className="space-y-6">
              <DisputeEvidenceGallery evidence={dispute.evidence} />
              <div
                className={`${styles.premiumSurface} p-5 text-sm text-muted-foreground`}
              >
                Seller response and evidence submission are not enabled from
                this dashboard yet. Please review the dispute details and
                contact support if additional documentation is required.
              </div>
            </div>
          </div>
        </div>
      ) : null}

      {dispute ? (
        <div className="flex justify-end">
          <Link href={`/marketplace/dashboard/seller/disputes/${dispute.id}`}>
            <Button variant="outline" className={styles.secondaryAction}>
              Open Seller Dispute View
            </Button>
          </Link>
        </div>
      ) : null}
    </div>
  );
}
