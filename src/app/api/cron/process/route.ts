import { NextRequest, NextResponse } from "next/server";
import { processPendingJobs } from "@/worker";

export async function GET(req: NextRequest) {
  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret) {
    return NextResponse.json(
      { ok: false, error: "CRON_SECRET is not configured" },
      { status: 500 },
    );
  }

  const authHeader = req.headers.get("authorization");
  const querySecret = req.nextUrl.searchParams.get("secret");
  const isAuthorized =
    authHeader === `Bearer ${cronSecret}` || querySecret === cronSecret;

  if (!isAuthorized) {
    return NextResponse.json(
      { ok: false, error: "Unauthorized" },
      { status: 401 },
    );
  }

  const result = await processPendingJobs();
  return NextResponse.json({ ok: true, ...result });
}
