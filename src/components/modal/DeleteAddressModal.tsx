"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { AlertTriangle } from "lucide-react";
import { Address } from "@/lib/types";
import { deleteAddressAction } from "@/actions/checkout/addressAction";
import { useTransition } from "react";
import { useRouter } from "next/navigation";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  address: Address | null;
};

export default function DeleteAddressModal({
  open,
  onOpenChange,
  address,
}: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  if (!address) return null;

  const handleDelete = () => {
    startTransition(async () => {
      const res = await deleteAddressAction(address.id);
      if ("error" in res) return;

      onOpenChange(false);
      router.refresh();
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-red-600">
            <AlertTriangle className="w-5 h-5" />
            Delete address
          </DialogTitle>

          <DialogDescription>
            Are you sure you want to delete this address?
            <br />
            <span className="font-medium text-gray-900">
              {address.street}, {address.city}
            </span>
          </DialogDescription>
        </DialogHeader>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>

          <Button
            variant="destructive"
            onClick={handleDelete}
            disabled={isPending}
          >
            {isPending ? "Deleting…" : "Delete"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
