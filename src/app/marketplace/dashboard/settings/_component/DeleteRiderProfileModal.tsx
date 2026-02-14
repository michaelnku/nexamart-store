"use client";

import { useState } from "react";
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type DeleteRiderProfileModalProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  isPending: boolean;
  onConfirm: () => void;
};

const CONFIRM_TEXT = "CLEAR PROFILE";

export default function DeleteRiderProfileModal({
  open,
  onOpenChange,
  isPending,
  onConfirm,
}: DeleteRiderProfileModalProps) {
  const [confirmText, setConfirmText] = useState("");
  const isConfirmValid = confirmText.trim() === CONFIRM_TEXT;

  return (
    <AlertDialog
      open={open}
      onOpenChange={(nextOpen) => {
        onOpenChange(nextOpen);
        if (!nextOpen) setConfirmText("");
      }}
    >
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Clear rider profile?</AlertDialogTitle>
          <AlertDialogDescription>
            This permanently deletes your rider profile and schedule.
          </AlertDialogDescription>
        </AlertDialogHeader>

        <div className="space-y-2">
          <Label>Type "{CONFIRM_TEXT}" to confirm</Label>
          <Input
            value={confirmText}
            onChange={(e) => setConfirmText(e.target.value)}
            placeholder={CONFIRM_TEXT}
          />
        </div>

        <AlertDialogFooter>
          <AlertDialogCancel disabled={isPending}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={(e) => {
              e.preventDefault();
              onConfirm();
            }}
            disabled={isPending || !isConfirmValid}
            className="bg-red-600 hover:bg-red-700 text-white"
          >
            {isPending ? "Clearing..." : "Yes, clear"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
