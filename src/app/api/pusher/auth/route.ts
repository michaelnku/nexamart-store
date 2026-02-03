import { NextResponse } from "next/server";
import { pusherServer } from "@/lib/pusher";
import { CurrentUser } from "@/lib/currentUser";
import { prisma } from "@/lib/prisma";

const PRESENCE_PREFIX = "presence-conversation-";

export async function POST(req: Request) {
  const user = await CurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.formData();
  const socketId = body.get("socket_id")?.toString();
  const channel = body.get("channel_name")?.toString();

  if (!socketId || !channel) {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  if (channel.startsWith(PRESENCE_PREFIX)) {
    const conversationId = channel.slice(PRESENCE_PREFIX.length);

    if (user.role !== "ADMIN") {
      const isMember = await prisma.conversationMember.findFirst({
        where: { conversationId, userId: user.id },
        select: { id: true },
      });

      if (!isMember) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }
    }
  }

  const auth = pusherServer.authorizeChannel(socketId, channel, {
    user_id: user.id,
    user_info: {
      name: user.name ?? user.email ?? "User",
      role: user.role ?? "USER",
    },
  });

  return NextResponse.json(auth);
}
