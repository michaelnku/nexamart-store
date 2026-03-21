"use client";

import { useTransition } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { manageModeratorProductAction } from "@/actions/moderation/manageModeratorProduct";

type ModeratorProductActionButtonsProps = {
  productId: string;
  isPublished: boolean;
};

function canUnpublish(isPublished: boolean) {
  return isPublished;
}

function canRepublish(isPublished: boolean) {
  return !isPublished;
}

export function ModeratorProductActionButtons({
  productId,
  isPublished,
}: ModeratorProductActionButtonsProps) {
  const [isPending, startTransition] = useTransition();

  const runAction = (action: "unpublish" | "republish") => {
    startTransition(async () => {
      try {
        const result = await manageModeratorProductAction(productId, action);
        toast.success(result.message);
      } catch (error) {
        toast.error(
          error instanceof Error ? error.message : "Failed to update product.",
        );
      }
    });
  };

  return (
    <div className="flex flex-wrap gap-3">
      <Button
        disabled={isPending || !canUnpublish(isPublished)}
        onClick={() => runAction("unpublish")}
      >
        Unpublish Product
      </Button>

      <Button
        variant="secondary"
        disabled={isPending || !canRepublish(isPublished)}
        onClick={() => runAction("republish")}
      >
        Republish Product
      </Button>
    </div>
  );
}
