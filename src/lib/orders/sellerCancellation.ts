import { z } from "zod";

export const SELLER_CANCELLATION_REASONS = [
  "OUT_OF_STOCK",
  "STORE_CLOSED",
  "PRICE_ERROR",
  "ITEM_UNAVAILABLE",
  "DELIVERY_UNAVAILABLE",
  "CUSTOMER_REQUEST",
  "OTHER",
] as const;

export type SellerCancellationReason =
  (typeof SELLER_CANCELLATION_REASONS)[number];

export const sellerCancellationReasonLabels: Record<
  SellerCancellationReason,
  string
> = {
  OUT_OF_STOCK: "Out of stock",
  STORE_CLOSED: "Store closed",
  PRICE_ERROR: "Price error",
  ITEM_UNAVAILABLE: "Item unavailable",
  DELIVERY_UNAVAILABLE: "Delivery unavailable",
  CUSTOMER_REQUEST: "Customer request",
  OTHER: "Other",
};

export function getSellerCancellationReasonLabel(
  reason: SellerCancellationReason | null | undefined,
) {
  if (!reason) return "Not specified";
  return sellerCancellationReasonLabels[reason] ?? reason.replaceAll("_", " ");
}

export const sellerCancelOrderInputSchema = z.object({
  sellerGroupId: z.string().min(1, "Seller group is required"),
  reason: z.enum(SELLER_CANCELLATION_REASONS, {
    errorMap: () => ({ message: "Select a cancellation reason" }),
  }),
  note: z
    .string()
    .trim()
    .max(300, "Note must be 300 characters or less")
    .optional()
    .transform((value) => {
      const nextValue = value?.trim();
      return nextValue ? nextValue : undefined;
    }),
});

export type SellerCancelOrderInput = z.infer<
  typeof sellerCancelOrderInputSchema
>;
