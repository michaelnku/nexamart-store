import { DeliveryStatus } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import {
  parseRiderDeliveryStatusKey,
  RIDER_DELIVERY_STATUS_FILTERS,
  type RiderDeliveryCounts,
  toRiderClientDeliveryStatus,
} from "@/lib/rider/types";
import {
  mapDeliveryWithClientAddress,
  mapPendingOrderRow,
} from "./riderDeliveryAction.view-helpers";

export async function loadRiderDeliveriesView({
  userId,
  statusKey,
}: {
  userId: string;
  statusKey?: string;
}) {
  const activeKey = parseRiderDeliveryStatusKey(statusKey);

  const countsRaw = await prisma.delivery.groupBy({
    by: ["status"],
    where: { riderId: userId },
    _count: { _all: true },
  });

  const [pendingUnassignedDeliveriesCount, pendingReadyOrdersCount] =
    await Promise.all([
      prisma.delivery.count({
        where: {
          status: { in: ["PENDING_ASSIGNMENT"] as DeliveryStatus[] },
          riderId: null,
        },
      }),
      prisma.order.count({
        where: {
          isPaid: true,
          status: { in: ["READY", "ACCEPTED"] },
          delivery: null,
          sellerGroups: {
            some: {},
            every: {
              OR: [
                { status: "VERIFIED_AT_HUB" },
                { status: "ARRIVED_AT_HUB" },
                { status: "READY" },
                { status: "CANCELLED" },
              ],
            },
          },
        },
      }),
    ]);

  const counts: RiderDeliveryCounts = {
    pending:
      (countsRaw.find((c) => c.status === "PENDING_ASSIGNMENT")?._count._all ??
        0) +
      pendingUnassignedDeliveriesCount +
      pendingReadyOrdersCount,
    assigned: countsRaw.find((c) => c.status === "ASSIGNED")?._count._all ?? 0,
    ongoing: countsRaw.find((c) => c.status === "PICKED_UP")?._count._all ?? 0,
    delivered:
      countsRaw.find((c) => c.status === "DELIVERED")?._count._all ?? 0,
    cancelled:
      countsRaw.find((c) => c.status === "CANCELLED")?._count._all ?? 0,
  };

  const deliveries = await prisma.delivery.findMany({
    where:
      activeKey === "pending"
        ? {
            status: {
              in: RIDER_DELIVERY_STATUS_FILTERS[activeKey],
            },
            OR: [{ riderId: userId }, { riderId: null }],
          }
        : {
            riderId: userId,
            status: {
              in: RIDER_DELIVERY_STATUS_FILTERS[activeKey],
            },
          },
    orderBy: { assignedAt: "desc" },
    include: {
      order: {
        select: {
          id: true,
          trackingNumber: true,
          deliveryStreet: true,
          deliveryCity: true,
          deliveryState: true,
          deliveryCountry: true,
          deliveryPostal: true,
          totalAmount: true,
          shippingFee: true,
          status: true,
          createdAt: true,
          customer: { select: { name: true, email: true } },
        },
      },
    },
  });

  const deliveriesWithAddress = deliveries.map((delivery) =>
    mapDeliveryWithClientAddress(delivery),
  );

  const pendingOrdersWithoutDelivery =
    activeKey === "pending"
      ? await prisma.order.findMany({
          where: {
            isPaid: true,
            status: { in: ["READY", "ACCEPTED"] },
            delivery: null,
            sellerGroups: {
              some: {},
              every: {
                OR: [
                  { status: "VERIFIED_AT_HUB" },
                  { status: "ARRIVED_AT_HUB" },
                  { status: "READY" },
                  { status: "CANCELLED" },
                ],
              },
            },
          },
          orderBy: { createdAt: "desc" },
          select: {
            id: true,
            trackingNumber: true,
            deliveryStreet: true,
            deliveryCity: true,
            deliveryState: true,
            deliveryCountry: true,
            deliveryPostal: true,
            totalAmount: true,
            shippingFee: true,
            status: true,
            createdAt: true,
            customer: { select: { name: true, email: true } },
          },
        })
      : [];

  const pendingOrderRows = pendingOrdersWithoutDelivery.map((order) =>
    mapPendingOrderRow(order),
  );

  const mergedDeliveries =
    activeKey === "pending"
      ? [...deliveriesWithAddress, ...pendingOrderRows].sort((a, b) => {
          const aTime = new Date(a.assignedAt ?? a.order.createdAt).getTime();
          const bTime = new Date(b.assignedAt ?? b.order.createdAt).getTime();
          return bTime - aTime;
        })
      : deliveriesWithAddress;

  return { deliveries: mergedDeliveries, counts, activeKey };
}
