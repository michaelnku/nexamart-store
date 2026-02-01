"use client";

import { useState, useTransition } from "react";
import { createConversationAction } from "@/actions/inbox/createConversationAction";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { NewConversation } from "@/lib/types";
import { Field, FieldGroup } from "../ui/field";
import { Textarea } from "../ui/textarea";

type Props = {
  onCreated: (conversation: NewConversation) => void;
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

      if (!res.ok) {
        toast.error(res.error);
        return;
      }

      toast.success("Ticket opened successfully!");
      onCreated(res?.conversation);
      onClose();
    });
  };

  return (
    <div className="space-y-4">
      <form>
        <FieldGroup>
          <Field>
            <Input
              placeholder="Subject"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              required
            />
          </Field>
          <Field>
            <Textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Describe your issue..."
              className="w-full rounded-md border p-3 text-sm"
              rows={4}
              required
            />
          </Field>
        </FieldGroup>

        <div className="flex justify-end gap-2 mt-4">
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
      </form>
    </div>
  );
}
