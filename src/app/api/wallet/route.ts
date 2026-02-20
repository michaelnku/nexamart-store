import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { CurrentUserId } from "@/lib/currentUser";
import { calculateWalletBalance } from "@/lib/ledger/calculateWalletBalance";

export async function GET() {
  const userId = await CurrentUserId();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const wallet = await prisma.wallet.findUnique({
    where: { userId },
    select: { id: true },
  });

  if (!wallet) {
    return NextResponse.json({ balance: 0 });
  }

  const balance = await calculateWalletBalance(wallet.id);

  return NextResponse.json({
    balance,
  });
}
