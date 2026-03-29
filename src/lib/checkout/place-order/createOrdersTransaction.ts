import "server-only";

import type { DeliveryType, PaymentMethod } from "@/generated/prisma/client";
import { generateTrackingNumber } from "@/components/helper/generateTrackingNumber";
import { prisma } from "@/lib/prisma";
import { reserveOrderInventoryInTx } from "@/lib/inventory/reservationService";
import { buildSellerGroupCodes } from "./buildSellerGroupCodes";
import { PlaceOrderError } from "./placeOrder.errors";
import type {
  CreatedOrdersPayload,
  InternalOrderGroup,
  ValidatedOrderAddress,
} from "./placeOrder.types";

export async function createOrdersTransaction({
  userId,
  address,
  paymentMethod,
  deliveryType,
  checkoutDistanceInMiles,
  checkoutTotalAmount,
  orderGroups,
  validatedCouponResult,
  idempotencyKey,
}: {
  userId: string;
  address: ValidatedOrderAddress;
  paymentMethod: PaymentMethod;
  deliveryType: DeliveryType;
  checkoutDistanceInMiles: number;
  checkoutTotalAmount: number;
  orderGroups: InternalOrderGroup[];
  validatedCouponResult: {
    coupon: { id: string; type: string; value: number } | null;
    discountAmount: number;
  };
  idempotencyKey: string;
}) {
  const createdOrders: CreatedOrdersPayload = [];
  let checkoutGroupId: string | null = null;

  await prisma.$transaction(async (tx) => {
    let checkoutGroup: { id: string } | null = null;

    if (orderGroups.length > 1) {
      checkoutGroup = await tx.checkoutGroup.create({
        data: {
          userId,
          total: checkoutTotalAmount,
        },
        select: { id: true },
      });
    }

    checkoutGroupId = checkoutGroup?.id ?? null;

    for (const group of orderGroups) {
      const createdOrder = await tx.order.create({
        data: {
          userId,
          checkoutGroupId: checkoutGroup?.id ?? null,
          deliveryFullName: address.fullName,
          deliveryPhone: address.phone,
          deliveryStreet: address.street,
          deliveryCity: address.city,
          deliveryState: address.state ?? "",
          deliveryCountry: address.country,
          deliveryPostal: address.postalCode ?? "",
          paymentMethod,
          deliveryType,
          distanceInMiles: group.distanceInMiles || checkoutDistanceInMiles,
          shippingFee: group.shippingFee,
          totalAmount: group.totalAmount,
          isPaid: false,
          isFoodOrder: group.isFoodOrder,
          couponId: validatedCouponResult.coupon?.id ?? null,
          discountAmount:
            group.subtotal + group.shippingFee - group.totalAmount > 0
              ? group.subtotal + group.shippingFee - group.totalAmount
              : null,
          trackingNumber: generateTrackingNumber(),
          status: "PENDING_PAYMENT",
        },
      });

      const sellerGroups = [];
      for (const storeGroup of group.stores) {
        const createdSellerGroup = await tx.orderSellerGroup.create({
          data: {
            orderId: createdOrder.id,
            sellerRevenue: storeGroup.sellerRevenue,
            platformCommission: storeGroup.platformCommission,
            storeId: storeGroup.storeId,
            sellerId: storeGroup.sellerId,
            subtotal: storeGroup.subtotal,
            shippingFee: storeGroup.shippingFee,
            ...buildSellerGroupCodes(createdOrder.id, storeGroup.storeId),
          },
          select: {
            id: true,
            sellerId: true,
            storeId: true,
            subtotal: true,
            shippingFee: true,
          },
        });

        for (const item of storeGroup.items) {
          const createdOrderItem = await tx.orderItem.create({
            data: {
              orderId: createdOrder.id,
              sellerGroupId: createdSellerGroup.id,
              productId: item.productId,
              variantId: item.variantId,
              quantity: item.quantity,
              price: item.priceUSD,
              basePrice: item.basePriceUSD,
              optionsPrice: item.optionsPriceUSD,
              lineTotal: item.lineTotalUSD,
            },
            select: {
              id: true,
            },
          });

          if (item.selectedOptions.length > 0) {
            await tx.orderItemSelectedOption.createMany({
              data: item.selectedOptions.map((selection) => ({
                orderItemId: createdOrderItem.id,
                optionGroupName: selection.optionGroupName,
                optionName: selection.optionName,
                priceDeltaUSD: selection.priceDeltaUSD,
              })),
            });
          }
        }

        sellerGroups.push({
          ...createdSellerGroup,
          storeName: storeGroup.storeName,
        });
      }

      await reserveOrderInventoryInTx(tx, createdOrder.id);

      await tx.delivery.create({
        data: {
          orderId: createdOrder.id,
          status: "PENDING_ASSIGNMENT",
          fee: group.shippingFee,
          riderPayoutAmount: group.riderPayoutAmount,
          deliveryAddress: [
            createdOrder.deliveryStreet,
            createdOrder.deliveryCity,
            createdOrder.deliveryState,
            createdOrder.deliveryCountry,
            createdOrder.deliveryPostal,
          ]
            .filter((part) => Boolean(part && part.trim()))
            .join(", "),
          distance: group.distanceInMiles || checkoutDistanceInMiles,
        },
      });

      createdOrders.push({
        id: createdOrder.id,
        status: createdOrder.status,
        trackingNumber: createdOrder.trackingNumber,
        isFoodOrder: createdOrder.isFoodOrder,
        sellerGroups,
      });
    }

    if (validatedCouponResult.coupon?.id) {
      await tx.couponUsage.create({
        data: {
          couponId: validatedCouponResult.coupon.id,
          userId,
          orderId: createdOrders[0]?.id,
        },
      });

      await tx.coupon.update({
        where: { id: validatedCouponResult.coupon.id },
        data: { usedCount: { increment: 1 } },
      });
    }

    const keyRecord = await tx.idempotencyKey.findUnique({
      where: { key: idempotencyKey },
      select: { userId: true },
    });

    if (keyRecord && keyRecord.userId !== userId) {
      throw new PlaceOrderError(
        "Invalid checkout request. Please refresh and try again.",
      );
    }

    if (keyRecord) {
      await tx.idempotencyKey.update({
        where: { key: idempotencyKey },
        data: { orderId: createdOrders[0]?.id ?? null },
      });
    } else {
      await tx.idempotencyKey.create({
        data: {
          key: idempotencyKey,
          userId,
          orderId: createdOrders[0]?.id ?? null,
        },
      });
    }
  });

  return {
    createdOrders,
    checkoutGroupId,
  };
}

