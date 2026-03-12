import { TransactionStatus } from "@/generated/prisma/client";
import { stripe } from "@/lib/stripe";

type RefundCapturedCardPaymentInput = {
  orderId: string;
  sellerGroupId: string;
  amount: number;
  paymentReference: string;
};

type RefundCapturedCardPaymentResult = {
  reference: string;
  status: TransactionStatus;
  description: string;
};

function extractPaymentIntentId(paymentReference: string, orderId: string) {
  const prefix = "order-payment-";
  const suffix = `-${orderId}`;

  if (
    !paymentReference.startsWith(prefix) ||
    !paymentReference.endsWith(suffix) ||
    paymentReference.length <= prefix.length + suffix.length
  ) {
    throw new Error("Unable to resolve Stripe payment reference for refund");
  }

  return paymentReference.slice(prefix.length, paymentReference.length - suffix.length);
}

function mapStripeRefundStatus(
  status: string | null | undefined,
): TransactionStatus {
  if (status === "succeeded") return "SUCCESS";
  if (status === "canceled") return "CANCELLED";
  if (status === "failed") return "FAILED";
  return "PENDING";
}

export async function refundCapturedCardPayment({
  orderId,
  sellerGroupId,
  amount,
  paymentReference,
}: RefundCapturedCardPaymentInput): Promise<RefundCapturedCardPaymentResult> {
  const paymentIntentId = extractPaymentIntentId(paymentReference, orderId);
  const refundReference = `seller-cancel-refund-${sellerGroupId}`;

  const refund = await stripe.refunds.create(
    {
      payment_intent: paymentIntentId,
      amount: Math.round(amount * 100),
      reason: "requested_by_customer",
      metadata: {
        orderId,
        sellerGroupId,
        refundReference,
        source: "seller_order_cancellation",
      },
    },
    {
      idempotencyKey: refundReference,
    },
  );

  const status = mapStripeRefundStatus(refund.status);
  const description =
    status === "SUCCESS"
      ? "Card refund issued to the original payment method."
      : status === "CANCELLED"
        ? "Card refund was cancelled before completion."
        : status === "FAILED"
          ? "Card refund failed. Please review the payment record."
          : "Card refund has been initiated and is processing.";

  return {
    reference: refundReference,
    status,
    description,
  };
}
