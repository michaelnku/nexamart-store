import { NextRequest, NextResponse } from "next/server";
import { processPendingJobs } from "@/worker";
import { prisma } from "@/lib/prisma";

const CRON_LOCK_NAME = "job_processor";
const CRON_LOCK_WINDOW_MS = 2 * 60 * 1000;

async function acquireCronLock() {
  const now = new Date();
  const staleBefore = new Date(now.getTime() - CRON_LOCK_WINDOW_MS);

  try {
    await prisma.cronLock.create({
      data: { name: CRON_LOCK_NAME, lockedAt: now },
    });
    return { acquired: true };
  } catch {
    const updated = await prisma.cronLock.updateMany({
      where: {
        name: CRON_LOCK_NAME,
        lockedAt: { lt: staleBefore },
      },
      data: { lockedAt: now },
    });
    return { acquired: updated.count === 1 };
  }
}

export async function GET(req: NextRequest) {
  const cronSecret = process.env.CRON_SECRET;
  const querySecret = req.nextUrl.searchParams.get("secret");

  if (!cronSecret || querySecret !== cronSecret) {
    return NextResponse.json({ ok: false }, { status: 401 });
  }

  const lock = await acquireCronLock();
  if (!lock.acquired) {
    return NextResponse.json({ ok: true, skipped: true });
  }

  const result = await processPendingJobs(20);

  return NextResponse.json({
    ok: true,
    processed: result.processed,
  });
}
