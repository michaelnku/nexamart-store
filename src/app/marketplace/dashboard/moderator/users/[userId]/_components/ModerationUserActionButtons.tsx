"use client";

import { useTransition } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { manageModerationUserAction } from "@/actions/moderation/manageModerationUser";

type ModerationUserActionButtonsProps = {
  userId: string;
  softBlockedUntil: string | null;
};

function hasActiveSoftBlock(softBlockedUntil: string | null) {
  return !!softBlockedUntil && new Date(softBlockedUntil) > new Date();
}

export function ModerationUserActionButtons({
  userId,
  softBlockedUntil,
}: ModerationUserActionButtonsProps) {
  const [isPending, startTransition] = useTransition();
  const blocked = hasActiveSoftBlock(softBlockedUntil);

  const runAction = (
    action: "soft_block" | "clear_soft_block" | "reset_summary",
  ) => {
    startTransition(async () => {
      try {
        const result = await manageModerationUserAction(userId, action);
        toast.success(result.message);
      } catch (error) {
        toast.error(
          error instanceof Error
            ? error.message
            : "Failed to update user moderation.",
        );
      }
    });
  };

  return (
    <div className="flex flex-wrap gap-3">
      <Button
        disabled={isPending || blocked}
        onClick={() => runAction("soft_block")}
      >
        Apply Soft Block
      </Button>

      <Button
        variant="secondary"
        disabled={isPending || !blocked}
        onClick={() => runAction("clear_soft_block")}
      >
        Clear Soft Block
      </Button>

      <Button
        variant="outline"
        disabled={isPending}
        onClick={() => runAction("reset_summary")}
      >
        Reset Summary
      </Button>
    </div>
  );
}
