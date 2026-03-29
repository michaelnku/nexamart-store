import "server-only";

import { prisma } from "@/lib/prisma";
import { calculateWalletBalance } from "@/lib/ledger/calculateWalletBalance";

export async function validateWalletCheckout({
  userId,
  checkoutTotalAmount,
}: {
  userId: string;
  checkoutTotalAmount: number;
}) {
  const wallet = await prisma.wallet.findUnique({
    where: { userId },
    select: { id: true, status: true },
  });

  if (!wallet || wallet.status !== "ACTIVE") {
    return {
      error: "Activate your wallet before paying with it.",
    } as const;
  }

  const availableWalletBalance = await calculateWalletBalance(wallet.id);

  if (availableWalletBalance < checkoutTotalAmount) {
    return {
      error:
        "Insufficient wallet balance. Please choose another payment method.",
    } as const;
  }

  return { success: true } as const;
}
