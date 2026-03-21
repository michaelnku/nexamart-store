"use client";

import { useTransition } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { reviewModerationIncidentAction } from "@/actions/moderation/reviewModerationIncident";

type IncidentActionButtonsProps = {
  incidentId: string;
  status: string;
  reviewStatus: string;
};

function canConfirmOrOverturn(status: string, reviewStatus: string) {
  return status === "OPEN" && reviewStatus === "PENDING_HUMAN_REVIEW";
}

function canIgnore(status: string) {
  return status === "OPEN";
}

function canEscalate(status: string, reviewStatus: string) {
  return status === "OPEN" && reviewStatus !== "PENDING_HUMAN_REVIEW";
}

export function IncidentActionButtons({
  incidentId,
  status,
  reviewStatus,
}: IncidentActionButtonsProps) {
  const [isPending, startTransition] = useTransition();

  const runAction = (
    action: "confirm" | "overturn" | "ignore" | "escalate",
  ) => {
    startTransition(async () => {
      try {
        const result = await reviewModerationIncidentAction(incidentId, action);
        toast.success(result.message);
      } catch (error) {
        toast.error(
          error instanceof Error ? error.message : "Failed to review incident.",
        );
      }
    });
  };

  return (
    <div className="flex flex-wrap gap-3">
      <Button
        disabled={isPending || !canConfirmOrOverturn(status, reviewStatus)}
        onClick={() => runAction("confirm")}
      >
        Confirm
      </Button>

      <Button
        variant="secondary"
        disabled={isPending || !canConfirmOrOverturn(status, reviewStatus)}
        onClick={() => runAction("overturn")}
      >
        Overturn
      </Button>

      <Button
        variant="outline"
        disabled={isPending || !canIgnore(status)}
        onClick={() => runAction("ignore")}
      >
        Ignore
      </Button>

      <Button
        variant="destructive"
        disabled={isPending || !canEscalate(status, reviewStatus)}
        onClick={() => runAction("escalate")}
      >
        Escalate
      </Button>
    </div>
  );
}
