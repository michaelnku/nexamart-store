"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Trash2, UploadCloud } from "lucide-react";
import { toast } from "sonner";

import { raiseOrderDisputeAction } from "@/actions/order/disputeActions";
import { deleteFileAction } from "@/actions/actions";
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
import { UploadButton } from "@/utils/uploadthing";

type UploadedEvidenceFile = {
  url: string;
  key: string;
  name?: string;
  type?: string;
  size?: number;
};

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
  const [files, setFiles] = useState<UploadedEvidenceFile[]>([]);
  const [removingKeys, setRemovingKeys] = useState<Set<string>>(new Set());

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
        await raiseOrderDisputeAction(
          orderId,
          reason,
          description,
          undefined,
          files.map((file) => ({
            fileUrl: file.url,
            fileKey: file.key,
            fileName: file.name,
            mimeType: file.type,
            fileSize: file.size,
          })),
        );
        toast.success("Dispute raised successfully.");
        onOpenChange(false);
        setDescription("");
        setReason("ITEM_NOT_RECEIVED");
        setFiles([]);
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

  const handleRemoveFile = async (key: string) => {
    if (removingKeys.has(key)) {
      return;
    }

    setRemovingKeys((current) => new Set(current).add(key));

    try {
      await deleteFileAction(key);
      setFiles((current) => current.filter((file) => file.key !== key));
      toast.success("Evidence removed");
    } catch {
      toast.error("Failed to remove evidence");
    } finally {
      setRemovingKeys((current) => {
        const next = new Set(current);
        next.delete(key);
        return next;
      });
    }
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
          </div>

          <div className="space-y-3 rounded-lg border border-slate-200/80 bg-slate-50/70 p-4 dark:border-zinc-800 dark:bg-zinc-900/60">
            <div className="flex items-start gap-2">
              <div className="rounded-xl bg-sky-100 p-2 text-sky-700 dark:bg-sky-500/10 dark:text-sky-300">
                <UploadCloud className="h-4 w-4" />
              </div>
              <div>
                <p className="text-sm font-medium text-foreground">
                  Add opening evidence
                </p>
                <p className="text-xs text-muted-foreground">
                  Upload optional image or video proof now. These files will be
                  attached when the dispute is opened.
                </p>
              </div>
            </div>

            <UploadButton
              endpoint="evidenceFiles"
              appearance={{
                button:
                  "ut-ready:bg-[#3c9ee0] ut-ready:hover:bg-[#318bc4] ut-uploading:bg-[#318bc4] ut-button:rounded-xl ut-button:h-10 ut-button:px-4 ut-button:text-sm ut-button:font-semibold",
              }}
              onClientUploadComplete={(uploadedFiles) => {
                const accepted = uploadedFiles.filter(
                  (file) =>
                    file.type?.startsWith("image/") ||
                    file.type?.startsWith("video/"),
                );

                const rejected = uploadedFiles.filter(
                  (file) =>
                    !file.type?.startsWith("image/") &&
                    !file.type?.startsWith("video/"),
                );

                if (rejected.length > 0) {
                  toast.error(
                    "Only image and video evidence can be attached when opening a dispute.",
                  );

                  void Promise.all(
                    rejected.map((file) =>
                      deleteFileAction(file.key).catch(() => null),
                    ),
                  );
                }

                setFiles((current) => {
                  const next = [...current];
                  const overflowKeys: string[] = [];

                  for (const file of accepted) {
                    if (next.length >= 6) {
                      overflowKeys.push(file.key);
                      continue;
                    }

                    if (!next.some((item) => item.key === file.key)) {
                      next.push({
                        url: file.url,
                        key: file.key,
                        name: file.name,
                        type: file.type,
                        size: file.size,
                      });
                    }
                  }

                  if (overflowKeys.length > 0) {
                    toast.error("Only up to 6 opening evidence files can be attached.");

                    void Promise.all(
                      overflowKeys.map((key) =>
                        deleteFileAction(key).catch(() => null),
                      ),
                    );
                  }

                  return next;
                });
              }}
              onUploadError={(uploadError) => {
                toast.error(uploadError.message);
              }}
            />

            {files.length > 0 ? (
              <div className="space-y-2">
                {files.map((file) => (
                  <div
                    key={file.key}
                    className="flex items-center justify-between rounded-xl border border-slate-200/80 bg-white px-3 py-2 text-sm dark:border-zinc-800 dark:bg-zinc-950"
                  >
                    <div className="min-w-0">
                      <p className="truncate font-medium text-slate-900 dark:text-zinc-100">
                        {file.name ?? file.key}
                      </p>
                      <p className="text-xs text-slate-500 dark:text-zinc-400">
                        {file.type?.startsWith("video/") ? "Video" : "Image"}
                      </p>
                    </div>

                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => handleRemoveFile(file.key)}
                      disabled={removingKeys.has(file.key) || isPending}
                    >
                      {removingKeys.has(file.key) ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Trash2 className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                ))}
              </div>
            ) : null}
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
