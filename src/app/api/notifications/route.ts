import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { CurrentUserId } from "@/lib/currentUser";

export async function GET() {
  const userId = await CurrentUserId();

  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const notifications = await prisma.notification.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    take: 30,
  });

  const unreadCount = await prisma.notification.count({
    where: { userId, read: false },
  });

  return NextResponse.json({
    notifications,
    unreadCount,
  });
}
