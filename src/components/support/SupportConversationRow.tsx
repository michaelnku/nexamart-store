"use client";

import { assignAgentAction } from "@/actions/inbox/admin/assignAgentAction";
import { Button } from "@/components/ui/button";
import { useTransition } from "react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

export default function SupportConversationRow({
  conversation,
  currentAgentId,
}: {
  conversation: {
    id: string;
    subject: string | null;
    agentId: string | null;
    agentName: string | null;
    lastMessage: string;
    hasUnread: boolean;
    updatedAt: string;
  };
  currentAgentId: string;
}) {
  const [pending, startTransition] = useTransition();
  const router = useRouter();
  const assignToMe = async () => {
    const res = await assignAgentAction({
      conversationId: conversation.id,
      agentId: currentAgentId,
    });
    if (res?.error) {
      toast.error(res.error);
      return res;
    }
    toast.success("You are now assigned to this conversation");
    return res;
  };

  return (
    <div className="flex items-center justify-between rounded-lg border p-4">
      <div className="min-w-0">
        <div className="flex items-center gap-2">
          <p className="font-medium truncate">
            {conversation.subject ?? "Support Request"}
          </p>
          {conversation.hasUnread && (
            <span className="h-2 w-2 rounded-full bg-[var(--brand-blue)]" />
          )}
        </div>
        <p className="text-xs text-muted-foreground truncate">
          {conversation.lastMessage}
        </p>

        <p className="text-xs mt-1">
          {conversation.agentId
            ? `Assigned to ${conversation.agentName}`
            : "Unassigned (AI handling)"}
        </p>
      </div>

      {!conversation.agentId ? (
        <Button
          size="sm"
          disabled={pending}
          onClick={() =>
            startTransition(() => {
              void assignToMe().then((res) => {
                if (!res?.error) {
                  router.push(
                    `/marketplace/dashboard/admin/support/${conversation.id}`,
                  );
                }
              });
            })
          }
        >
          Assign to me
        </Button>
      ) : conversation.agentId === currentAgentId ? (
        <Button
          size="sm"
          className="bg-[var(--brand-blue)] hover:bg-[var(--brand-blue)]/90"
          onClick={() =>
            router.push(
              `/marketplace/dashboard/admin/support/${conversation.id}`,
            )
          }
        >
          Continue
        </Button>
      ) : (
        <Button
          size="sm"
          variant="outline"
          onClick={() =>
            router.push(
              `/marketplace/dashboard/admin/support/${conversation.id}`,
            )
          }
        >
          View
        </Button>
      )}
    </div>
  );
}
