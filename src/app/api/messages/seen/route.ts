import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { CurrentRole, CurrentUserId } from "@/lib/currentUser";
import { pusherServer } from "@/lib/pusher";
import { SenderType } from "@/generated/prisma/client";

export async function POST(req: Request) {
  const userId = await CurrentUserId();
  const role = await CurrentRole();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { conversationId, targetSenderType } = await req.json();
  if (!conversationId) {
    return NextResponse.json({ error: "Missing conversationId" }, { status: 400 });
  }

  const senderType: SenderType = targetSenderType ?? "SUPPORT";

  const conversation = await prisma.conversation.findFirst({
    where: { id: conversationId },
    select: {
      id: true,
      type: true,
      members: {
        where: { userId },
        select: { id: true },
      },
    },
  });

  if (!conversation) {
    return NextResponse.json({ error: "Conversation not found" }, { status: 404 });
  }

  const isAllowed =
    conversation.members.length > 0 ||
    (role === "ADMIN" && conversation.type === "SUPPORT");

  if (!isAllowed) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const readAt = new Date();
  await prisma.message.updateMany({
    where: {
      conversationId,
      readAt: null,
      ...(targetSenderType
        ? { senderType }
        : {
            OR: [
              { senderId: { not: userId } },
              { senderId: null, senderType: { in: ["SUPPORT", "SYSTEM"] } },
            ],
          }),
    },
    data: { readAt },
  });

  await pusherServer.trigger(`conversation-${conversationId}`, "seen", {
    readAt: readAt.toISOString(),
  });

  return NextResponse.json({ success: true });
}
