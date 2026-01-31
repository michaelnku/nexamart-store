"use client";

import { useRouter } from "next/navigation";
import OrderTrackGrid from "@/components/order/OrderTrackGrid";
import { OrderTrackDTO } from "@/lib/types";
import { NoActiveOrdersState } from "./NoActiveOrdersState";
import { extractTrackingNumber } from "@/components/helper/extractTrackingNumbe";

export default function TrackAllOrdersClient({
  orders,
}: {
  orders: OrderTrackDTO[];
}) {
  const router = useRouter();

  const handleScanResult = (value: string) => {
    const trackingNumber = extractTrackingNumber(value);
    router.push(`/customer/order/track/tn/${trackingNumber}`);
  };

  if (orders.length === 0) {
    return <NoActiveOrdersState onSearch={handleScanResult} />;
  }

  return <OrderTrackGrid orders={orders} />;
}
