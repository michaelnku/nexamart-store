import { revalidatePath } from "next/cache";

export function revalidateSellerOrderPaths(orderId: string) {
  revalidatePath("/marketplace/dashboard/seller/orders");
  revalidatePath(`/marketplace/dashboard/seller/orders/${orderId}`);
}

export function revalidateCancellationPaths(
  orderId: string,
  trackingNumber?: string | null,
) {
  revalidatePath("/marketplace/dashboard/seller/orders");
  revalidatePath(`/marketplace/dashboard/seller/orders/${orderId}`);
  revalidatePath("/marketplace/dashboard/rider/deliveries");
  revalidatePath("/customer/order/history");
  revalidatePath(`/customer/order/${orderId}`);
  revalidatePath(`/customer/order/track/${orderId}`);

  if (trackingNumber) {
    revalidatePath(`/customer/order/track/tn/${trackingNumber}`);
  }

  revalidatePath("/");
}

