import { NextResponse } from "next/server";
import { CurrentUserId } from "@/lib/currentUser";
import { getVerificationProgress } from "@/lib/verification/getVerificationProgress";

export async function GET() {
  const userId = await CurrentUserId();

  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const progress = await getVerificationProgress(userId);

  return NextResponse.json(progress);
}
