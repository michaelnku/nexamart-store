import { CurrentUserId } from "@/lib/currentUser";
import InboxLayout from "@/components/inbox/InboxLayout";
import { getUserConversations } from "@/lib/support/getUserConversations";

export default async function MessagesPage({
  searchParams,
}: {
  searchParams: Promise<{ conversation?: string }>;
}) {
  const userId = await CurrentUserId();
  if (!userId) return null;

  const conversations = await getUserConversations(userId);
  const { conversation } = await searchParams;
  const initialActiveId = conversations.some((item) => item.id === conversation)
    ? conversation
    : null;

  return (
    <div className="h-[calc(100dvh-4rem)] min-h-0 overflow-hidden mx-auto max-w-5xl px-6 py-10">
      <InboxLayout
        conversations={conversations}
        currentUserId={userId}
        initialActiveId={initialActiveId}
      />
    </div>
  );
}
