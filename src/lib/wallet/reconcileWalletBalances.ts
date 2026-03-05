import { prisma } from "@/lib/prisma";

const DEFAULT_AUTO_FIX_THRESHOLD = 10;
const FLOAT_EPSILON = 0.000001;

type WalletRow = {
  id: string;
  balance: number;
};

export type ReconcileWalletBalancesResult = {
  walletsChecked: number;
  mismatches: number;
  walletsFixed: number;
  anomalies: Array<{
    walletId: string;
    previousBalance: number;
    ledgerBalance: number;
    difference: number;
  }>;
};

function roundToCents(value: number) {
  return Math.round(value * 100) / 100;
}

function computeLedgerBalance(credit: number, debit: number) {
  return roundToCents(credit - debit);
}

export async function reconcileWalletBalances(
  autoFixThreshold = DEFAULT_AUTO_FIX_THRESHOLD,
): Promise<ReconcileWalletBalancesResult> {
  const wallets: WalletRow[] = await prisma.wallet.findMany({
    select: { id: true, balance: true },
  });

  if (wallets.length === 0) {
    return {
      walletsChecked: 0,
      mismatches: 0,
      walletsFixed: 0,
      anomalies: [],
    };
  }

  const walletIds = wallets.map((wallet) => wallet.id);

  const grouped = await prisma.ledgerEntry.groupBy({
    by: ["walletId", "direction"],
    where: {
      walletId: { in: walletIds },
    },
    _sum: { amount: true },
  });

  const ledgerByWallet = new Map<string, { credit: number; debit: number }>();

  for (const row of grouped) {
    if (!row.walletId) continue;
    const existing = ledgerByWallet.get(row.walletId) ?? { credit: 0, debit: 0 };

    if (row.direction === "CREDIT") {
      existing.credit = row._sum.amount ?? 0;
    } else {
      existing.debit = row._sum.amount ?? 0;
    }

    ledgerByWallet.set(row.walletId, existing);
  }

  let mismatches = 0;
  let walletsFixed = 0;
  const anomalies: ReconcileWalletBalancesResult["anomalies"] = [];

  for (const wallet of wallets) {
    const aggregate = ledgerByWallet.get(wallet.id) ?? { credit: 0, debit: 0 };
    const ledgerBalance = computeLedgerBalance(aggregate.credit, aggregate.debit);
    const previousBalance = roundToCents(wallet.balance);
    const difference = roundToCents(ledgerBalance - previousBalance);

    if (Math.abs(difference) < FLOAT_EPSILON) continue;

    mismatches += 1;
    const shouldAutoFix = Math.abs(difference) <= autoFixThreshold;

    if (!shouldAutoFix) {
      console.warn(
        `[wallet-reconcile] large mismatch detected for wallet ${wallet.id}: ` +
          `cached=${previousBalance}, ledger=${ledgerBalance}, diff=${difference}`,
      );

      anomalies.push({
        walletId: wallet.id,
        previousBalance,
        ledgerBalance,
        difference,
      });

      await prisma.walletReconciliationLog.create({
        data: {
          walletId: wallet.id,
          previousBalance,
          ledgerBalance,
          fixed: false,
        },
      });

      continue;
    }

    const updated = await prisma.$transaction(async (tx) => {
      const updateResult = await tx.wallet.updateMany({
        where: { id: wallet.id, balance: wallet.balance },
        data: { balance: ledgerBalance },
      });

      const fixed = updateResult.count === 1;

      await tx.walletReconciliationLog.create({
        data: {
          walletId: wallet.id,
          previousBalance,
          ledgerBalance,
          fixed,
        },
      });

      return fixed;
    });

    if (updated) walletsFixed += 1;
  }

  return {
    walletsChecked: wallets.length,
    mismatches,
    walletsFixed,
    anomalies,
  };
}
