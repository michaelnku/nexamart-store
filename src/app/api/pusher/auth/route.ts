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

  const form = await req.formData();
  const socketId = form.get("socket_id");
  const channel = form.get("channel_name");

  if (typeof socketId !== "string" || typeof channel !== "string") {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }

  if (channel.startsWith(PRESENCE_PREFIX)) {
    const conversationId = channel.replace(PRESENCE_PREFIX, "");

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
      name: user.name ?? "User",
      role: user.role ?? "USER",
    },
  });

  return NextResponse.json(auth);
}
