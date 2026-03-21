"use client";

import { useTransition } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { reviewUserReportAction } from "@/actions/moderation/reviewUserReport";

type ReportActionButtonsProps = {
  reportId: string;
  status: string;
};

function canMoveToUnderReview(status: string) {
  return status === "OPEN";
}

function canResolve(status: string) {
  return status === "OPEN" || status === "UNDER_REVIEW";
}

function canReject(status: string) {
  return status === "OPEN" || status === "UNDER_REVIEW";
}

export function ReportActionButtons({
  reportId,
  status,
}: ReportActionButtonsProps) {
  const [isPending, startTransition] = useTransition();

  const runAction = (action: "under_review" | "resolved" | "rejected") => {
    startTransition(async () => {
      try {
        const result = await reviewUserReportAction(reportId, action);
        toast.success(result.message);
      } catch (error) {
        toast.error(
          error instanceof Error ? error.message : "Failed to update report.",
        );
      }
    });
  };

  return (
    <div className="flex flex-wrap gap-3">
      <Button
        variant="secondary"
        disabled={isPending || !canMoveToUnderReview(status)}
        onClick={() => runAction("under_review")}
      >
        Mark Under Review
      </Button>

      <Button
        disabled={isPending || !canResolve(status)}
        onClick={() => runAction("resolved")}
      >
        Resolve
      </Button>

      <Button
        variant="outline"
        disabled={isPending || !canReject(status)}
        onClick={() => runAction("rejected")}
      >
        Reject
      </Button>
    </div>
  );
}
