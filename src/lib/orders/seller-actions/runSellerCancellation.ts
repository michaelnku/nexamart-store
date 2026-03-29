import { cancelSellerOrder } from "@/lib/orders/cancelSellerOrder";
import { sellerCancelOrderInputSchema } from "@/lib/orders/sellerCancellation";
import type { SellerOrderActionResult } from "./sellerOrderAction.types";

export async function runSellerCancellation({
  sellerId,
  input,
}: {
  sellerId: string;
  input: {
    sellerGroupId: string;
    reason: string;
    note?: string;
  };
}): Promise<
  | { result: SellerOrderActionResult }
  | {
      result: SellerOrderActionResult;
      revalidate: { orderId: string; trackingNumber: string | null };
    }
> {
  const parsedInput = sellerCancelOrderInputSchema.safeParse(input);

  if (!parsedInput.success) {
    return { result: { error: "We couldn't update this order right now. Please refresh and try again." } };
  }

  const result = await cancelSellerOrder({
    sellerId,
    input: parsedInput.data,
  });

  return {
    result: {
      success: result.alreadyCancelled
        ? "Order cancellation was already processed"
        : "Seller cancellation completed successfully",
      alreadyDone: result.alreadyCancelled,
    },
    revalidate: {
      orderId: result.orderId,
      trackingNumber: result.trackingNumber,
    },
  };
}
