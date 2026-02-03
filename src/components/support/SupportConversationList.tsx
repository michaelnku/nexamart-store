"use client";
import SupportConversationRow from "./SupportConversationRow";

type Conversation = {
  id: string;
  subject: string | null;
  agentId: string | null;
  agentName: string | null;
  lastMessage: string;
  hasUnread: boolean;
  updatedAt: string;
};

export default function SupportConversationList({
  conversations,
  currentAgentId,
}: {
  conversations: Conversation[];
  currentAgentId: string;
}) {
  return (
    <div className="max-w-4xl mx-auto p-6 space-y-4">
      <h1 className="text-xl font-semibold">Support Tickets</h1>

      <div className="space-y-3">
        {conversations.map((c) => (
          <SupportConversationRow
            key={c.id}
            conversation={c}
            currentAgentId={currentAgentId}
          />
        ))}
      </div>
    </div>
  );
}
