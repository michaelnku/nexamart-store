"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

type FoodPrepTimeModalProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (prepTimeMinutes: number) => void;
  isSubmitting?: boolean;
};

export default function FoodPrepTimeModal({
  open,
  onOpenChange,
  onConfirm,
  isSubmitting = false,
}: FoodPrepTimeModalProps) {
  const [minutes, setMinutes] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    if (open) {
      setMinutes("");
      setError("");
    }
  }, [open]);

  const handleSubmit = () => {
    const parsed = Number.parseInt(minutes, 10);
    if (!Number.isInteger(parsed) || parsed < 1 || parsed > 180) {
      setError("Prep time must be a whole number between 1 and 180.");
      return;
    }

    setError("");
    onConfirm(parsed);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Set Food Preparation Time</DialogTitle>
          <DialogDescription>
            Enter how many minutes this order will take before it is ready for
            rider pickup.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-2">
          <label
            htmlFor="prep-time-minutes"
            className="text-sm font-medium text-gray-700"
          >
            Preparation time (minutes)
          </label>
          <Input
            id="prep-time-minutes"
            type="number"
            min={1}
            max={180}
            step={1}
            value={minutes}
            onChange={(event) => {
              setMinutes(event.target.value);
              if (error) setError("");
            }}
            placeholder="e.g. 25"
            disabled={isSubmitting}
          />
          {error ? <p className="text-xs text-red-600">{error}</p> : null}
        </div>

        <DialogFooter className="gap-2">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={isSubmitting}>
            Confirm
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
