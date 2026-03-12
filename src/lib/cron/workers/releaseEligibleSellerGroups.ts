import { prisma } from "@/lib/prisma";
import { acquireCronLock, releaseCronLock } from "@/lib/cron/workers/cronLock";
import { getOrCreateSystemEscrowAccount } from "@/lib/ledger/systemEscrowWallet";
import { createServiceContext } from "@/lib/system/serviceContext";
import { releaseSellerGroupPayoutInTx } from "@/lib/payout/sellerPayouts";

const LOCK_NAME = "RELEASE_ELIGIBLE_SELLER_GROUPS";
const BATCH_SIZE = 20;

export async function releaseEligibleSellerGroups() {
  const hasLock = await acquireCronLock(LOCK_NAME);
  if (!hasLock) {
    return { skipped: true, processed: 0 };
  }

  try {
    const now = new Date();
    const context = createServiceContext("SELLER_PAYOUT_CRON");
    const systemEscrowAccount = await getOrCreateSystemEscrowAccount();

    const groups = await prisma.orderSellerGroup.findMany({
      where: {
        payoutStatus: "PENDING",
        payoutReleasedAt: null,
        payoutLocked: false,
        payoutEligibleAt: { lte: now },
        order: {
          isPaid: true,
          status: "DELIVERED",
          disputeId: null,
        },
      },
      orderBy: { payoutEligibleAt: "asc" },
      select: { id: true },
      take: BATCH_SIZE,
    });

    let processed = 0;

    for (const candidate of groups) {
      await prisma.$transaction(async (tx) => {
        const released = await releaseSellerGroupPayoutInTx(
          tx,
          candidate.id,
          systemEscrowAccount,
          {
            now,
            context,
          },
        );

        if ("success" in released) {
          processed += 1;
        }
      });
    }

    return { skipped: false, processed };
  } finally {
    await releaseCronLock(LOCK_NAME);
  }
}
