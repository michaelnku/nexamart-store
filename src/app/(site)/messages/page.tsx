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
    <div className="mx-auto h-[calc(100dvh-4rem)] min-h-0 max-w-5xl overflow-hidden bg-white px-4 py-4 dark:bg-neutral-950 sm:px-6 lg:px-8">
      <InboxLayout
        conversations={conversations}
        currentUserId={userId}
        initialActiveId={initialActiveId}
      />
    </div>
  );
}
