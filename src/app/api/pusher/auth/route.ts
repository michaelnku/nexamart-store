import { NextResponse } from "next/server";
import { pusherServer } from "@/lib/pusher";
import { CurrentUser } from "@/lib/currentUser";
import { prisma } from "@/lib/prisma";

const PRESENCE_PREFIX = "presence-conversation-";

export async function POST(req: Request) {
  const user = await CurrentUser();
  if (!user) {
    console.log("[pusher-auth] unauthorized");
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const form = await req.formData();
  const socketId = form.get("socket_id");
  const channel = form.get("channel_name");

  if (typeof socketId !== "string" || typeof channel !== "string") {
    console.log("[pusher-auth] invalid payload", { socketId, channel });
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }

  console.log("[pusher-auth] request", {
    userId: user.id,
    role: user.role,
    channel,
  });

  let isAgent = user.role === "ADMIN";

  if (channel.startsWith(PRESENCE_PREFIX)) {
    const conversationId = channel.replace(PRESENCE_PREFIX, "");

    if (!isAgent) {
      const isMember = await prisma.conversationMember.findFirst({
        where: { conversationId, userId: user.id },
        select: { id: true },
      });

      if (!isMember) {
        console.log("[pusher-auth] forbidden", {
          userId: user.id,
          channel,
        });
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }
    }

    if (!isAgent) {
      const agentProfile = await prisma.agentProfile.findUnique({
        where: { userId: user.id },
        select: { isActive: true },
      });
      isAgent = !!agentProfile?.isActive;
    }
  }

  const auth = pusherServer.authorizeChannel(socketId, channel, {
    user_id: user.id,
    user_info: {
      name: user.name ?? "User",
      role: user.role ?? "USER",
      isAgent,
    },
  });

  console.log("[pusher-auth] authorized", {
    userId: user.id,
    channel,
    isAgent,
  });

  return NextResponse.json(auth);
}
