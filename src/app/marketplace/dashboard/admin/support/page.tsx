import SupportConversationList from "@/components/support/SupportConversationList";
import { prisma } from "@/lib/prisma";
import { CurrentRole, CurrentUserId } from "@/lib/currentUser";

export default async function SupportPage() {
  const role = await CurrentRole();
  if (role !== "ADMIN") {
    return (
      <div className="max-w-3xl mx-auto p-6 text-sm text-muted-foreground">
        You do not have permission to view this page.
      </div>
    );
  }

  const agentId = await CurrentUserId();
  if (!agentId) {
    return (
      <div className="max-w-3xl mx-auto p-6 text-sm text-muted-foreground">
        Unable to load your account. Please sign in again.
      </div>
    );
  }

  const conversations = await prisma.conversation.findMany({
    where: {
      type: "SUPPORT",
      status: "OPEN",
    },
    orderBy: { updatedAt: "desc" },
    include: {
      messages: {
        take: 1,
        orderBy: { createdAt: "desc" },
        select: {
          content: true,
          createdAt: true,
          senderType: true,
          readAt: true,
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
        select: { id: true, name: true },
      })
    : [];

  const agentMap = new Map(agents.map((a) => [a.id, a.name]));

  return (
    <SupportConversationList
      currentAgentId={agentId}
      conversations={conversations.map((c) => ({
        id: c.id,
        subject: c.subject,
        agentId: c.agentId,
        agentName: c.agentId ? (agentMap.get(c.agentId) ?? null) : null,
        lastMessage: c.messages[0]?.content ?? "",
        hasUnread:
          c.messages[0]?.senderType === "USER" && !c.messages[0]?.readAt,
        updatedAt: c.updatedAt.toISOString(),
      }))}
    />
  );
}
