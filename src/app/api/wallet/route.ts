import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { CurrentUserId } from "@/lib/currentUser";

export async function GET() {
  const userId = await CurrentUserId();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const wallet = await prisma.wallet.findUnique({
    where: { userId },
    select: { balance: true },
  });

  return NextResponse.json({
    balance: wallet?.balance ?? 0,
  });
}
