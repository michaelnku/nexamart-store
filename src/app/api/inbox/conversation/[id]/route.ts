import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { CurrentUserId } from "@/lib/currentUser";

export async function GET(
  _: Request,
  context: { params: Promise<{ id: string }> },
) {
  const userId = await CurrentUserId();
  if (!userId) return NextResponse.json({ messages: [] });

  const { id } = await context.params;
  if (!id) {
    console.error("❌ conversation Id is missing in params");
    return NextResponse.json(
      { error: "Missing conversationId" },
      { status: 400 },
    );
  }

  const conversation = await prisma.conversation.findFirst({
    where: {
      id: id,
      members: { some: { userId } },
    },
    include: {
      messages: { orderBy: { createdAt: "asc" } },
    },
  });

  if (!conversation) {
    return NextResponse.json({ messages: [] });
  }

  return NextResponse.json({
    messages: conversation.messages.map((m) => ({
      id: m.id,
      conversationId: m.conversationId,
      senderType: m.senderType,
      content: m.content,
      createdAt: m.createdAt.toISOString(),
    })),
  });
}
