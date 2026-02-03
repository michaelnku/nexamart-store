import { prisma } from "@/lib/prisma";
import { CurrentRole, CurrentUserId } from "@/lib/currentUser";
import AdminChatBox from "@/components/support/AdminChatBox";

export default async function AdminSupportChatPage({
  params,
}: {
  params: { conversationId: string };
}) {
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

  const conversation = await prisma.conversation.findFirst({
    where: {
      id: params.conversationId,
      type: "SUPPORT",
    },
    include: {
      messages: { orderBy: { createdAt: "asc" } },
    },
  });

  if (!conversation) {
    return (
      <div className="max-w-3xl mx-auto p-6 text-sm text-muted-foreground">
        Conversation not found.
      </div>
    );
  }

  await prisma.message.updateMany({
    where: {
      conversationId: conversation.id,
      senderType: "USER",
      readAt: null,
    },
    data: {
      readAt: new Date(),
    },
  });

  const customer = await prisma.user.findUnique({
    where: { id: conversation.userId },
    select: { name: true, username: true, email: true },
  });

  const customerName =
    customer?.name ?? customer?.username ?? customer?.email ?? "Customer";

  return (
    <div className="h-[calc(100dvh-4rem)] min-h-0 overflow-hidden">
      <AdminChatBox
        conversationId={conversation.id}
        initialMessages={conversation.messages.map((m) => ({
          id: m.id,
          conversationId: m.conversationId,
          senderType: m.senderType,
          senderId: m.senderId ?? null,
          content: m.content,
          createdAt: m.createdAt.toISOString(),
          readAt: m.readAt?.toISOString() ?? null,
          deliveredAt: m.deliveredAt?.toISOString() ?? null,
        }))}
        customerName={customerName}
        canSend={!conversation.agentId || conversation.agentId === agentId}
      />
    </div>
  );
}
