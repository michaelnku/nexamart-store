import { prisma } from "@/lib/prisma";

export async function getUserConversations(userId: string) {
  const conversations = await prisma.conversation.findMany({
    where: {
      members: {
        some: { userId },
      },
      type: {
        in: ["SUPPORT", "ORDER", "SYSTEM", "PRODUCT_INQUIRY"],
      },
      status: {
        notIn: ["DELETED", "BLOCKED"],
      },
    },
    orderBy: [{ lastMessageAt: "desc" }, { updatedAt: "desc" }],
    include: {
      agent: {
        select: {
          id: true,
          name: true,
          username: true,
        },
      },
      product: {
        select: {
          id: true,
          name: true,
        },
      },
      store: {
        select: {
          id: true,
          name: true,
        },
      },
      members: {
        where: {
          userId: {
            not: userId,
          },
        },
        select: {
          user: {
            select: {
              id: true,
              name: true,
              username: true,
              email: true,
              role: true,
            },
          },
        },
        take: 1,
      },
      messages: {
        take: 1,
        orderBy: {
          createdAt: "desc",
        },
        select: {
          content: true,
          senderId: true,
          senderType: true,
          createdAt: true,
        },
      },
      _count: {
        select: {
          members: true,
          messages: {
            where: {
              readAt: null,
              OR: [
                {
                  senderId: {
                    not: userId,
                  },
                },
                {
                  senderId: null,
                  senderType: {
                    in: ["SUPPORT", "SYSTEM"],
                  },
                },
              ],
            },
          },
        },
      },
    },
  });

  return conversations.map((conversation) => ({
    id: conversation.id,
    type: conversation.type,
    subject: conversation.subject ?? "Conversation",
    agentId: conversation.agent?.id ?? null,
    agentName: conversation.agent
      ? (conversation.agent.name ??
          conversation.agent.username ??
          "Support Agent")
      : null,
    participantName: conversation.members[0]
      ? (conversation.members[0].user.name ??
          conversation.members[0].user.username ??
          conversation.members[0].user.email)
      : null,
    participantRole: conversation.members[0]?.user.role ?? null,
    productId: conversation.productId ?? null,
    productName: conversation.product?.name ?? null,
    storeId: conversation.storeId ?? null,
    storeName: conversation.store?.name ?? null,
    canDelete:
      conversation.type === "SUPPORT" || conversation._count.members <= 1,
    unreadCount: conversation._count.messages,
    lastMessage: conversation.messages[0]
      ? {
          content: conversation.messages[0].content,
          senderId: conversation.messages[0].senderId ?? null,
          senderType: conversation.messages[0].senderType,
          createdAt: conversation.messages[0].createdAt.toISOString(),
        }
      : undefined,
  }));
}
