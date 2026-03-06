import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { CurrentUserId } from "@/lib/currentUser";

export async function POST() {
  const userId = await CurrentUserId();

  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  await prisma.notification.updateMany({
    where: {
      userId,
      read: false,
    },
    data: {
      read: true,
    },
  });

  return NextResponse.json({ success: true });
}
