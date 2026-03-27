import { prisma } from "@/lib/prisma";
import OrderCard from "@/components/order/OrderCard";
import DisputeEvidenceUploadCard from "@/components/evidence/DisputeEvidenceUploadCard";
import LinkedDeliveryEvidenceCard from "@/components/evidence/LinkedDeliveryEvidenceCard";
import { OrderDetailDTO } from "@/lib/types";
import { CurrentUserId } from "@/lib/currentUser";
import {
  getDeliveryEvidenceForViewer,
  getDisputeEvidenceTimelineForViewer,
  getDisputeMessagesForViewer,
} from "@/lib/evidence/queries";
import {
  getSellerCancellationReasonLabel,
  type SellerCancellationReason,
} from "@/lib/orders/sellerCancellation";

export default async function OrderDetailsPage({
  params,
}: {
  params: Promise<{ orderId: string }>;
}) {
  const { orderId } = await params;
  const userId = await CurrentUserId();

  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: {
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
          disputeSellerGroupImpacts: {
            include: {
              sellerGroup: {
                include: {
                  seller: { select: { name: true } },
                  store: { select: { name: true } },
                },
              },
            },
          },
          returnRequest: true,
        },
      },
      items: {
        include: {
          product: {
            include: {
              images: {
                include: productImageWithAssetInclude,
              },
            },
          },
          variant: true,
        },
      },
      delivery: true,
      customer: true,
      orderTimelines: {
        orderBy: { createdAt: "asc" },
      },
      transactions: {
        where: {
          type: "REFUND",
        },
        select: {
          reference: true,
          status: true,
          description: true,
        },
      },
      sellerGroups: {
        include: {
          store: true,
          seller: true,
          items: {
            include: {
              product: {
                include: {
                  images: {
                    include: productImageWithAssetInclude,
                  },
                },
              },
              variant: true,
            },
          },
        },
      },
    },
  });

  if (!order) {
    return (
      <p className="min-h-full py-40 text-center text-red-500 dark:text-red-400">Order not found</p>
    );
  }

  if (order.userId !== userId) {
    return <p className="text-slate-600 dark:text-zinc-400">Unauthorized</p>;
  }

  const disputeEvidence = order.dispute
    ? await getDisputeEvidenceTimelineForViewer({
        disputeId: order.dispute.id,
        viewerKind: "BUYER",
      })
    : [];
  const disputeMessages = order.dispute
    ? await getDisputeMessagesForViewer({
        disputeId: order.dispute.id,
        viewerKind: "BUYER",
      })
    : [];
  const deliveryEvidence = order.dispute
    ? await getDeliveryEvidenceForViewer({
        orderId: order.id,
        viewerKind: "BUYER",
      })
    : [];

  const deliveryAddress = [
    order.deliveryStreet,
    order.deliveryCity,
    order.deliveryState,
    order.deliveryCountry,
    order.deliveryPostal,
  ]
    .filter((part) => Boolean(part && part.trim()))
    .join(", ");

  const refundBySellerGroupReference = new Map(
    order.transactions
      .filter((transaction) => transaction.reference)
      .map((transaction) => [transaction.reference as string, transaction]),
  );

  const orderDTO: OrderDetailDTO = {
    id: order.id,
    status: order.status,
    trackingNumber: order.trackingNumber,
    isFoodOrder: order.isFoodOrder,
    deliveryType: order.deliveryType,
    deliveryAddress,
    paymentMethod: order.paymentMethod,
    shippingFee: order.shippingFee,
    totalAmount: order.totalAmount,
    createdAt: order.createdAt.toISOString(),
    deliveredAt: order.delivery?.deliveredAt?.toISOString() ?? null,
    customer: {
      name: order.customer.name,
      email: order.customer.email,
    },
    sellerGroups: order.sellerGroups.map((group) => ({
      id: group.id,
      status: group.status,
      subtotal: group.subtotal,
      sellerRevenue: group.sellerRevenue,
      platformCommission: group.platformCommission,
      sellerName: group.seller.name,
      payoutLocked: group.payoutLocked,
      payoutStatus: group.payoutStatus,
      payoutReleasedAt: group.payoutReleasedAt?.toISOString() ?? null,
      store: {
        name: group.store.name,
        slug: group.store.slug,
      },
      cancellation: group.cancelledAt
        ? {
            cancelledAt: group.cancelledAt.toISOString(),
            cancelledBy: group.cancelledBy ?? "SELLER",
            reason: group.cancelReason ?? "OTHER",
            reasonLabel: getSellerCancellationReasonLabel(
              group.cancelReason as SellerCancellationReason | null,
            ),
            note: group.cancelNote ?? null,
            refundStatus:
              refundBySellerGroupReference.get(`seller-cancel-refund-${group.id}`)
                ?.status ?? null,
            refundMessage:
              refundBySellerGroupReference.get(`seller-cancel-refund-${group.id}`)
                ?.description ?? null,
          }
        : null,
      items: group.items.map((item) => ({
        id: item.id,
        quantity: item.quantity,
        price: item.price,
        product: {
          name: item.product.name,
          images: item.product.images.map((img) => ({
            imageUrl: img.fileAsset.url,
          })),
        },
        variant: item.variant
          ? {
              color: item.variant.color,
              size: item.variant.size,
            }
          : null,
      })),
    })),
    dispute: order.dispute
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
          evidence: disputeEvidence,
          messages: disputeMessages,
          sellerImpacts: order.dispute.disputeSellerGroupImpacts.map((impact) => ({
            id: impact.id,
            sellerGroupId: impact.sellerGroupId,
            refundAmount: impact.refundAmount,
            sellerName: impact.sellerGroup.seller.name,
            storeName: impact.sellerGroup.store.name,
          })),
          linkedDeliveryEvidence: deliveryEvidence,
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
      : null,
    orderTimelines: order.orderTimelines.map((timeline) => ({
      id: timeline.id,
      status: timeline.status,
      message: timeline.message,
      createdAt: timeline.createdAt.toISOString(),
    })),
  };

  const trackingNumber = order.trackingNumber ?? "NEX-ORD-XXXXX";

  return (
    <div className="mx-auto max-w-4xl py-10">
      <div className="mx-auto max-w-6xl rounded-lg border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-900 dark:border-blue-900/60 dark:bg-blue-950/30 dark:text-blue-100">
        A one-time delivery code will be sent to your phone number. Please call
        it out to the rider at the delivery point for order:{" "}
        <span className="font-semibold">{trackingNumber}</span>.
      </div>
      <OrderCard order={orderDTO} />

      {order.dispute ? (
        <div className="mx-auto mt-6 max-w-6xl space-y-6 px-4">
          <DisputeEvidenceUploadCard
            disputeId={order.dispute.id}
            visibilityOptions={["PARTIES_AND_ADMIN", "BUYER_AND_ADMIN"]}
          />
          <LinkedDeliveryEvidenceCard
            disputeId={order.dispute.id}
            deliveryEvidence={deliveryEvidence}
          />
        </div>
      ) : null}
    </div>
  );
}
import { productImageWithAssetInclude } from "@/lib/product-images";
