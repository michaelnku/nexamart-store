import type { DeliveryStatus, PaymentMethod } from "@/generated/prisma/client";
import type { OrderDisputeSummaryDTO } from "./dispute.types";
import type { DeliveryType, OrderStatus } from "./order.types";

export type OrderTrackItemDTO = {
  id: string;
  quantity: number;

  product: {
    name: string;
    images: {
      imageUrl: string;
    }[];
  };
};

export type OrderTrackDeliveryDTO = {
  status: string;
  rider?: {
    name: string | null;
    email: string;
  } | null;
};

export type DeliveryDTO = {
  id: string;
  orderId: string;
  riderId?: string | null;
  status: DeliveryStatus;
  deliveryAddress?: string | null;
  distance?: number | null;
  fee: number;
  assignedAt?: string | null;
  deliveredAt?: string | null;
};

export type OrderTrackTimelineDTO = {
  id: string;
  status: OrderStatus;
  message?: string | null;
  createdAt: string;
};

export type OrderTrackDTO = {
  id: string;
  trackingNumber: string | null;
  status: OrderStatus;
  isFoodOrder?: boolean;
  deliveryType: DeliveryType;
  deliveryAddress?: string | null;
  paymentMethod?: PaymentMethod | null;
  shippingFee: number;
  totalAmount: number;
  createdAt: string;

  items: {
    id: string;
    quantity: number;
    product: {
      name: string;
      images: { imageUrl: string }[];
    };
  }[];

  delivery?: {
    status: string;
    rider?: {
      name: string | null;
      email: string;
    } | null;
  } | null;

  orderTimelines: OrderTrackTimelineDTO[];
};

export type OrderItemDTO = {
  id: string;
  quantity: number;
  price: number;

  product: {
    id: string;
    name: string;
    images: {
      imageUrl: string;
    }[];
  };

  variant?: {
    id: string;
    color?: string | null;
    size?: string | null;
  } | null;
};

export type OrderSummaryDTO = {
  id: string;
  createdAt: string;
  deliveryType: string;
  trackingNumber: string | null;
  totalAmount: number;
  shippingFee: number;
  status: string;
  isFoodOrder?: boolean;
  readyAt: string | null;

  items: OrderItemDTO[];
};

export type OrderHistoryItemDTO = {
  id: string;
  createdAt: string;
  status: string;
  totalAmount: number;
  trackingNumber: string | null;
  isFoodOrder?: boolean;
  prepTimeMinutes?: number | null;
  dispute?: OrderDisputeSummaryDTO | null;

  items: {
    id: string;
    quantity: number;

    product: {
      name: string;
      images: {
        imageUrl: string;
      }[];
    };
  }[];
};

export type OrderHistoryDTO = OrderHistoryItemDTO[];

export type OrderDetailItemDTO = {
  id: string;
  quantity: number;
  price: number;

  product: {
    name: string;
    images: { imageUrl: string }[];
  };

  variant?: {
    color?: string | null;
    size?: string | null;
  } | null;
};

export type OrderSellerGroupDTO = {
  id: string;
  status: string;
  subtotal: number;
  sellerRevenue?: number;
  platformCommission?: number;
  sellerName?: string | null;
  payoutLocked?: boolean;
  payoutStatus?: string;
  payoutReleasedAt?: string | null;

  store: {
    name: string;
    slug?: string | null;
  };

  cancellation?: {
    cancelledAt: string;
    cancelledBy: string;
    reason: string;
    reasonLabel: string;
    note?: string | null;
    refundStatus?: string | null;
    refundMessage?: string | null;
  } | null;

  items: OrderDetailItemDTO[];
};

export type OrderDetailDTO = {
  id: string;
  status: string;
  trackingNumber: string | null;
  isFoodOrder?: boolean;
  deliveryType: string;
  deliveryAddress?: string | null;
  paymentMethod?: string | null;
  shippingFee: number;
  totalAmount: number;
  createdAt: string;
  deliveredAt?: string | null;

  customer: {
    name: string | null;
    email: string;
  };

  sellerGroups: OrderSellerGroupDTO[];
  dispute?: OrderDisputeSummaryDTO | null;
  orderTimelines?: OrderTrackTimelineDTO[];
};
