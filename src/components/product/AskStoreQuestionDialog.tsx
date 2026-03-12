"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { MessageSquareMore, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { startProductInquiryConversationAction } from "@/actions/inbox/startProductInquiryConversationAction";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

type Props = {
  productId: string;
  productName: string;
  storeName: string;
  isLoggedIn: boolean;
};

export default function AskStoreQuestionDialog({
  productId,
  productName,
  storeName,
  isLoggedIn,
}: Props) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState("");
  const [isPending, startTransition] = useTransition();

  const handleOpenChange = (nextOpen: boolean) => {
    if (!isLoggedIn && nextOpen) {
      router.push("/auth/login");
      return;
    }

    setOpen(nextOpen);
  };

  const handleSubmit = () => {
    startTransition(async () => {
      const res = await startProductInquiryConversationAction({
        productId,
        message,
      });

      if (res?.error) {
        toast.error(res.error);
        return;
      }

      toast.success("Conversation started");
      setOpen(false);
      setMessage("");
      router.push(`/messages?conversation=${res.conversationId}`);
      router.refresh();
    });
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button className="mt-2 bg-[#3c9ee0] text-sm font-semibold text-white shadow-sm hover:bg-[#318bc4]">
          <MessageSquareMore className="mr-2 h-4 w-4" />
          Ask Store a Question
        </Button>
      </DialogTrigger>

      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Ask the store about this item</DialogTitle>
          <DialogDescription>
            Your first message will start or reopen the normal inbox conversation for this
            item.
          </DialogDescription>
        </DialogHeader>

        <div className="rounded-xl border bg-muted/30 px-4 py-3 text-sm">
          <p className="font-medium text-foreground">{productName}</p>
          <p className="text-muted-foreground">{storeName}</p>
        </div>

        <div className="space-y-2">
          <Label htmlFor={`store-question-${productId}`}>Message</Label>
          <Textarea
            id={`store-question-${productId}`}
            rows={5}
            value={message}
            onChange={(event) => setMessage(event.target.value)}
            autoFocus
            placeholder="Ask about ingredients, preparation time, availability, or anything the store should clarify."
            disabled={isPending}
          />
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={() => setOpen(false)} disabled={isPending}>
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={isPending || !message.trim()}
            className="bg-[var(--brand-blue)] text-white hover:bg-[var(--brand-blue)]/90"
          >
            {isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Starting...
              </>
            ) : (
              "Send question"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
