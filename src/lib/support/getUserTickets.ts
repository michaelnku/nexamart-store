import { prisma } from "@/lib/prisma";

type Ticket = {
  id: string;
  subject: string | null;
  status: string;
  lastReply: string;
  updatedAt: string;
};

export default async function getUserTickets(
  userId: string,
): Promise<Ticket[]> {
  const conversations = await prisma.conversation.findMany({
    where: {
      members: {
        some: {
          userId,
        },
      },
      type: "SUPPORT",
      status: {
        notIn: ["DELETED", "BLOCKED"],
      },
    },

    orderBy: {
      updatedAt: "desc",
    },

    include: {
      messages: {
        take: 1,
        orderBy: {
          createdAt: "desc",
        },
        select: {
          senderType: true,
        },
      },
    },
  });

  return conversations.map((c) => ({
    id: c.id,
    subject: c.subject,
    status: c.status,
    lastReply: c.messages[0]?.senderType === "USER" ? "You" : "Support Team",
    updatedAt: c.updatedAt.toLocaleDateString(),
  }));
}
