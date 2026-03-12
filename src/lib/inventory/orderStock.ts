import { InventoryReleaseReason, Prisma } from "@/generated/prisma/client";
import {
  commitOrderInventoryInTx,
  releaseSellerGroupInventoryInTx,
} from "@/lib/inventory/reservationService";

type Tx = Prisma.TransactionClient;

// Deprecated wrapper kept for compatibility with older imports.
export async function decrementOrderStockInTx(
  tx: Tx,
  orderIds: string[],
): Promise<void> {
  for (const orderId of orderIds) {
    await commitOrderInventoryInTx(tx, orderId);
  }
}

// Deprecated wrapper kept for compatibility with older cancellation flows.
export async function restoreSellerGroupStockInTx(
  tx: Tx,
  sellerGroupId: string,
): Promise<void> {
  await releaseSellerGroupInventoryInTx(tx, sellerGroupId, {
    allowCommittedRelease: true,
    reason: InventoryReleaseReason.SELLER_CANCELLATION,
  });
}
