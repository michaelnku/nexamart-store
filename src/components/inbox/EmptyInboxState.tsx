"use client";

import { Button } from "@/components/ui/button";
import { MessageSquarePlus } from "lucide-react";

export default function EmptyInboxState({
  onNewConversation,
}: {
  onNewConversation: () => void;
}) {
  return (
    <div className="flex flex-col items-center justify-center h-full text-center gap-4">
      <MessageSquarePlus className="w-12 h-12 text-gray-400" />

      <div>
        <p className="text-lg font-medium">No conversations yet</p>
        <p className="text-sm text-gray-500">
          Need help? Start a new support conversation.
        </p>
      </div>

      <Button
        onClick={onNewConversation}
        className="bg-[var(--brand-blue)] text-white"
      >
        Start new conversation
      </Button>
    </div>
  );
}
