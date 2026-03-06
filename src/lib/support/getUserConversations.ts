import { prisma } from "@/lib/prisma";

export async function getUserConversations(userId: string) {
  const conversations = await prisma.conversation.findMany({
    where: {
      members: {
        some: { userId },
      },
      status: {
        notIn: ["DELETED", "BLOCKED"],
      },
    },

    orderBy: {
      updatedAt: "desc",
    },

    include: {
      agent: {
        select: {
          id: true,
          name: true,
          username: true,
        },
      },

      messages: {
        take: 1,
        orderBy: {
          createdAt: "desc",
        },
        select: {
          content: true,
          senderType: true,
          createdAt: true,
        },
      },

      _count: {
        select: {
          messages: {
            where: {
              readAt: null,
              senderType: {
                not: "USER",
              },
            },
          },
        },
      },
    },
  });

  return conversations.map((c) => ({
    id: c.id,
    subject: c.subject ?? "Conversation",

    agentId: c.agent?.id ?? null,

    agentName: c.agent
      ? (c.agent.name ?? c.agent.username ?? "Support Agent")
      : null,

    unreadCount: c._count.messages,

    lastMessage: c.messages[0]
      ? {
          content: c.messages[0].content,
          senderType: c.messages[0].senderType,
          createdAt: c.messages[0].createdAt.toISOString(),
        }
      : undefined,
  }));
}
