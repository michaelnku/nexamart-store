"use client";

import { useState, useTransition } from "react";
import { createConversationAction } from "@/actions/inbox/createConversationAction";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { InboxConversation } from "@/lib/types";

type Props = {
  onCreated: (conversation: InboxConversation) => void;
  onClose: () => void;
};

export default function NewConversationModal({ onCreated, onClose }: Props) {
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [isPending, startTransition] = useTransition();

  const submit = () => {
    if (!message.trim()) return;

    startTransition(async () => {
      const res = await createConversationAction({ subject, message });

      if (res?.error) {
        toast.error(res.error);
        return;
      }

      toast.success("Conversation started");
      onCreated(res.conversation);
    });
  };

  return (
    <div className="space-y-4">
      <Input
        placeholder="Subject (optional)"
        value={subject}
        onChange={(e) => setSubject(e.target.value)}
      />

      <textarea
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        placeholder="Describe your issue..."
        className="w-full rounded-md border p-3 text-sm"
        rows={4}
      />

      <div className="flex justify-end gap-2">
        <Button variant="ghost" onClick={onClose}>
          Cancel
        </Button>
        <Button
          onClick={submit}
          disabled={isPending}
          className="bg-[var(--brand-blue)] text-white"
        >
          Send
        </Button>
      </div>
    </div>
  );
}
