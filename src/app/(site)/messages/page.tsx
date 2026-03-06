import { CurrentUserId } from "@/lib/currentUser";
import InboxLayout from "@/components/inbox/InboxLayout";
import { getUserConversations } from "@/lib/support/getUserConversations";

export default async function MessagesPage() {
  const userId = await CurrentUserId();
  if (!userId) return null;

  const conversations = await getUserConversations(userId);

  return (
    <div className="h-[calc(100dvh-4rem)] min-h-0 overflow-hidden">
      <InboxLayout conversations={conversations} currentUserId={userId} />
    </div>
  );
}
