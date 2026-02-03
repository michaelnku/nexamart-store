import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { CurrentUserId } from "@/lib/currentUser";
import { pusherServer } from "@/lib/pusher";
import { SenderType } from "@/generated/prisma/client";

export async function POST(req: Request) {
  const userId = await CurrentUserId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { conversationId, targetSenderType } = await req.json();
  if (!conversationId) {
    return NextResponse.json({ error: "Missing conversationId" }, { status: 400 });
  }

  const senderType: SenderType = targetSenderType ?? "SUPPORT";

  const conversation = await prisma.conversation.findFirst({
    where: { id: conversationId },
    select: { id: true },
  });

  if (!conversation) {
    return NextResponse.json({ error: "Conversation not found" }, { status: 404 });
  }

  const deliveredAt = new Date();
  await prisma.message.updateMany({
    where: {
      conversationId,
      senderType,
      deliveredAt: null,
    },
    data: { deliveredAt },
  });

  await pusherServer.trigger(`conversation-${conversationId}`, "delivered", {
    deliveredAt: deliveredAt.toISOString(),
  });

  return NextResponse.json({ success: true });
}
