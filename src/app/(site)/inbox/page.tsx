import { prisma } from "@/lib/prisma";
import { CurrentUserId } from "@/lib/currentUser";
import ChatApp from "./[conversationId]/ChatApp";
//import InboxLayout from "@/components/inbox/InboxLayout";

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

  //return <InboxLayout conversations={previews} />;

  return <ChatApp />;
}
