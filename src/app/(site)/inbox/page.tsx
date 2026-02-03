import { prisma } from "@/lib/prisma";
import { CurrentUserId } from "@/lib/currentUser";
import InboxLayout from "@/components/inbox/InboxLayout";

export default async function InboxPage() {
  const userId = await CurrentUserId();
  if (!userId) return null;

  const conversations = await prisma.conversation.findMany({
    where: {
      members: { some: { userId } },
    },
    orderBy: { updatedAt: "desc" },
    include: {
      messages: {
        take: 1,
        orderBy: { createdAt: "desc" },
        select: {
          content: true,
          senderType: true,
          createdAt: true,
        },
      },
    },
  });

  const agentIds = Array.from(
    new Set(conversations.map((c) => c.agentId).filter(Boolean)),
  ) as string[];

  const agents = agentIds.length
    ? await prisma.user.findMany({
        where: { id: { in: agentIds } },
        select: { id: true, name: true, username: true },
      })
    : [];

  const agentMap = new Map(
    agents.map((a) => [a.id, a.name ?? a.username ?? "Support Agent"]),
  );

  const previews = await Promise.all(
    conversations.map(async (c) => {
      const unreadCount = await prisma.message.count({
        where: {
          conversationId: c.id,
          readAt: null,
          senderType: { not: "USER" },
        },
      });

      return {
        id: c.id,
        subject: c.subject,
        agentId: c.agentId ?? null,
        agentName: c.agentId ? agentMap.get(c.agentId) ?? null : null,
        unreadCount,
        lastMessage: c.messages[0]
          ? {
              content: c.messages[0].content,
              senderType: c.messages[0].senderType,
              createdAt: c.messages[0].createdAt.toISOString(),
            }
          : undefined,
      };
    }),
  );

  return (
    <div className="h-[calc(100dvh-4rem)] min-h-0 overflow-hidden">
      <InboxLayout conversations={previews} />
    </div>
  );
}
