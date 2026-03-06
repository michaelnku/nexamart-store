import { prisma } from "@/lib/prisma";
import { CurrentUser } from "../currentUser";

export async function getUserSupportTickets() {
  const user = await CurrentUser();

  if (!user?.id) return [];

  const tickets = await prisma.conversation.findMany({
    where: {
      userId: user.id,
      type: "SUPPORT",
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
      },
    },
  });

  return tickets;
}
