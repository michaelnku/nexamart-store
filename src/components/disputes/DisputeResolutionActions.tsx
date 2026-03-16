"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import PartialRefundDialog from "@/components/disputes/PartialRefundDialog";
import { getDisputePolicy } from "@/lib/disputes/policy";
import { AdminDisputeDetailDTO } from "@/lib/types";
import {
  confirmReturnReceivedAction,
  resolveOrderDisputeAction,
} from "@/actions/order/disputeActions";

type ActionType =
  | "REFUND_BUYER"
  | "RELEASE_TO_SELLER"
  | "RETURN_AND_REFUND"
  | "CONFIRM_RETURN"
  | null;

type Props = {
  dispute: AdminDisputeDetailDTO;
};

function isTerminalStatus(status: AdminDisputeDetailDTO["status"]): boolean {
  return status === "RESOLVED" || status === "REJECTED";
}

export default function DisputeResolutionActions({ dispute }: Props) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [isPending, startTransition] = useTransition();
  const [confirmAction, setConfirmAction] = useState<ActionType>(null);
  const [partialOpen, setPartialOpen] = useState(false);

  const policy = getDisputePolicy(dispute.isFoodOrder, dispute.reason);
  const canResolve = !isTerminalStatus(dispute.status);
  const canRequireReturn =
    canResolve &&
    policy.allowedResolutions.includes("RETURN_AND_REFUND") &&
    dispute.status !== "WAITING_FOR_RETURN";
  const canConfirmReturn =
    dispute.status === "WAITING_FOR_RETURN" &&
    dispute.returnRequest?.status === "SHIPPED";
  const maxRefund = dispute.sellers.reduce(
    (sum, seller) => sum + Number(seller.refundAmount || 0),
    0,
  ) || dispute.totalAmount;

  const executeResolution = (action: Exclude<ActionType, null>) => {
    startTransition(async () => {
      try {
        if (action === "CONFIRM_RETURN") {
          await confirmReturnReceivedAction(dispute.orderId);
        } else {
          await resolveOrderDisputeAction(dispute.orderId, action);
        }

        toast.success("Dispute action completed successfully.");
        await queryClient.invalidateQueries({
          queryKey: ["admin-disputes-dashboard"],
        });
        setConfirmAction(null);
        router.refresh();
      } catch (error) {
        toast.error(
          error instanceof Error ? error.message : "Failed to update dispute.",
        );
      }
    });
  };

  return (
    <>
      <div className="flex flex-wrap gap-3">
        <Button
          type="button"
          variant="outline"
          disabled={!canResolve || isPending}
          onClick={() => setConfirmAction("RELEASE_TO_SELLER")}
        >
          Release Seller
        </Button>

        <Button
          type="button"
          variant="destructive"
          disabled={!canResolve || isPending}
          onClick={() => setConfirmAction("REFUND_BUYER")}
        >
          Full Refund
        </Button>

        <Button
          type="button"
          variant="outline"
          disabled={!canResolve || isPending}
          onClick={() => setPartialOpen(true)}
        >
          Partial Refund
        </Button>

        {canRequireReturn ? (
          <Button
            type="button"
            variant="outline"
            disabled={isPending}
            onClick={() => setConfirmAction("RETURN_AND_REFUND")}
          >
            Require Return
          </Button>
        ) : null}

        {canConfirmReturn ? (
          <Button
            type="button"
            disabled={isPending}
            onClick={() => setConfirmAction("CONFIRM_RETURN")}
          >
            Confirm Return Received
          </Button>
        ) : null}
      </div>

      <PartialRefundDialog
        open={partialOpen}
        onOpenChange={setPartialOpen}
        orderId={dispute.orderId}
        maxAmount={maxRefund}
      />

      <AlertDialog
        open={confirmAction !== null}
        onOpenChange={(open) => {
          if (!open) {
            setConfirmAction(null);
          }
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirm dispute action</AlertDialogTitle>
            <AlertDialogDescription>
              {confirmAction === "RELEASE_TO_SELLER"
                ? "This will resolve the dispute in favor of the seller and resume payout release."
                : confirmAction === "REFUND_BUYER"
                  ? "This will issue a refund to the customer and finalize the dispute."
                  : confirmAction === "RETURN_AND_REFUND"
                    ? "This will require the customer to return the item before refund completion."
                    : "This will confirm the returned item and complete the refund flow."}
            </AlertDialogDescription>
          </AlertDialogHeader>

          <AlertDialogFooter>
            <AlertDialogCancel disabled={isPending}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              disabled={isPending || confirmAction === null}
              onClick={(event) => {
                event.preventDefault();
                if (!confirmAction) {
                  return;
                }
                executeResolution(confirmAction);
              }}
            >
              {isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Processing...
                </>
              ) : (
                "Confirm"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
