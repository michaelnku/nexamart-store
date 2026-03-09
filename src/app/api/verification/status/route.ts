import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { CurrentUserId } from "@/lib/currentUser";

export async function GET() {
  const userId = await CurrentUserId();

  if (!userId) {
    return NextResponse.json({ status: "PENDING" });
  }

  const verification = await prisma.verification.findFirst({
    where: { userId },
    orderBy: { createdAt: "desc" },
    select: { status: true },
  });

  return NextResponse.json({
    status: verification?.status ?? "PENDING",
  });
}
