import { NextResponse } from "next/server";
import { acquireCronLock, releaseCronLock } from "@/lib/cron/workers/cronLock";
import { reconcileWalletBalances } from "@/lib/wallet/reconcileWalletBalances";

const LOCK_NAME = "reconcile-wallet-balances";

export async function POST(req: Request) {
  const cronSecret = process.env.CRON_SECRET;
  const providedSecret = req.headers.get("x-cron-secret");

  if (!cronSecret || providedSecret !== cronSecret) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const hasLock = await acquireCronLock(LOCK_NAME);
  if (!hasLock) {
    return NextResponse.json(
      { ok: true, skipped: true, reason: "Cron already running" },
      { status: 200 },
    );
  }

  try {
    const summary = await reconcileWalletBalances();

    return NextResponse.json(
      {
        walletsChecked: summary.walletsChecked,
        mismatches: summary.mismatches,
        walletsFixed: summary.walletsFixed,
        anomalies: summary.anomalies,
      },
      { status: 200 },
    );
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to reconcile wallets";

    return NextResponse.json({ error: message }, { status: 500 });
  } finally {
    await releaseCronLock(LOCK_NAME);
  }
}
