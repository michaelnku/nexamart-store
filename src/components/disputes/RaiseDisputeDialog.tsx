"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

import { raiseOrderDisputeAction } from "@/actions/order/disputeActions";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { getDisputeWindowText } from "@/lib/disputes/ui";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  orderId: string;
  isFoodOrder: boolean;
};

const disputeReasons = [
  { value: "ITEM_NOT_RECEIVED", label: "Item not received" },
  { value: "ITEM_DAMAGED", label: "Item damaged" },
  { value: "WRONG_ITEM", label: "Wrong item" },
  { value: "NOT_AS_DESCRIBED", label: "Not as described" },
  { value: "MISSING_ITEMS", label: "Missing items" },
  { value: "OTHER", label: "Other" },
] as const;

export default function RaiseDisputeDialog({
  open,
  onOpenChange,
  orderId,
  isFoodOrder,
}: Props) {
  const router = useRouter();
  const [reason, setReason] = useState<string>("ITEM_NOT_RECEIVED");
  const [description, setDescription] = useState("");
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const helperText = useMemo(
    () =>
      isFoodOrder
        ? "Food disputes do not support return flow. You can request a refund, partial refund, or seller release."
        : "Non-food disputes may require a return depending on the issue and review outcome.",
    [isFoodOrder],
  );

  const handleSubmit = () => {
    if (!description.trim()) {
      setError("Please describe the issue before submitting.");
      return;
    }

    setError(null);

    startTransition(async () => {
      try {
        await raiseOrderDisputeAction(orderId, reason, description);
        toast.success("Dispute raised successfully.");
        onOpenChange(false);
        setDescription("");
        setReason("ITEM_NOT_RECEIVED");
        router.refresh();
      } catch (submitError) {
        toast.error(
          submitError instanceof Error
            ? submitError.message
            : "Failed to raise dispute.",
        );
      }
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Raise Dispute</DialogTitle>
          <DialogDescription>
            Submit your dispute within {getDisputeWindowText(isFoodOrder)}. We will
            review your case and update the order status accordingly.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="dispute-reason">Dispute reason</Label>
            <Select
              value={reason}
              onValueChange={setReason}
              disabled={isPending}
            >
              <SelectTrigger id="dispute-reason">
                <SelectValue placeholder="Select a reason" />
              </SelectTrigger>
              <SelectContent>
                {disputeReasons.map((item) => (
                  <SelectItem key={item.value} value={item.value}>
                    {item.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="dispute-description">Description</Label>
            <Textarea
              id="dispute-description"
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              placeholder="Describe what happened, what was wrong with the order, and what outcome you expect."
              disabled={isPending}
              rows={5}
            />
          </div>

          <div className="rounded-lg bg-muted/40 p-3 text-sm text-muted-foreground">
            <p className="font-medium text-foreground">Current policy</p>
            <p className="mt-1">{helperText}</p>
            <p className="mt-2">
              Evidence upload is not yet available from this screen. Existing evidence
              will appear in the dispute details once supported by your account flow.
            </p>
          </div>

          {error ? <p className="text-sm text-red-600">{error}</p> : null}
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isPending}
          >
            Cancel
          </Button>
          <Button type="button" onClick={handleSubmit} disabled={isPending}>
            {isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Submitting...
              </>
            ) : (
              "Submit Dispute"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
