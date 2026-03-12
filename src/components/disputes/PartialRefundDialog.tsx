"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { resolveOrderDisputeAction } from "@/actions/order/disputeActions";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  orderId: string;
  maxAmount: number;
};

export default function PartialRefundDialog({
  open,
  onOpenChange,
  orderId,
  maxAmount,
}: Props) {
  const router = useRouter();
  const [value, setValue] = useState("");
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = () => {
    const amount = Number(value);

    if (!Number.isFinite(amount) || amount <= 0) {
      setError("Enter a valid refund amount.");
      return;
    }

    if (amount > maxAmount) {
      setError(`Refund amount cannot exceed $${maxAmount.toFixed(2)}.`);
      return;
    }

    setError(null);

    startTransition(async () => {
      try {
        await resolveOrderDisputeAction(orderId, "PARTIAL_REFUND", amount);
        toast.success("Partial refund applied successfully.");
        onOpenChange(false);
        setValue("");
        router.refresh();
      } catch (submitError) {
        toast.error(
          submitError instanceof Error
            ? submitError.message
            : "Failed to apply partial refund.",
        );
      }
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Apply Partial Refund</DialogTitle>
          <DialogDescription>
            Enter the refund amount to credit back to the customer.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-2">
          <Label htmlFor="partial-refund-amount">Refund amount (USD)</Label>
          <Input
            id="partial-refund-amount"
            type="number"
            min={0}
            max={maxAmount}
            step="0.01"
            value={value}
            onChange={(event) => setValue(event.target.value)}
            disabled={isPending}
          />
          <p className="text-xs text-muted-foreground">
            Maximum refundable amount: ${maxAmount.toFixed(2)}
          </p>
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
                Applying...
              </>
            ) : (
              "Apply Refund"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
