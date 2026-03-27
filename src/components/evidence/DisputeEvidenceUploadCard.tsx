"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import type { EvidenceVisibility } from "@/generated/prisma/client";
import { Loader2, MessageSquarePlus, UploadCloud } from "lucide-react";
import { toast } from "sonner";

import {
  createDisputeEvidenceAction,
  createDisputeMessageAction,
} from "@/actions/order/evidenceActions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { UploadButton } from "@/utils/uploadthing";

type Props = {
  disputeId: string;
  visibilityOptions: EvidenceVisibility[];
  sellerGroupId?: string | null;
  allowMessageComposer?: boolean;
  allowInternal?: boolean;
  onUploaded?: () => Promise<void> | void;
};

type PendingAttachment = {
  fileUrl: string;
  fileKey?: string;
  fileName?: string;
  mimeType?: string;
  fileSize?: number;
};

function labelize(value: string) {
  return value.replaceAll("_", " ").toLowerCase().replace(/\b\w/g, (part) => part.toUpperCase());
}

export default function DisputeEvidenceUploadCard({
  disputeId,
  visibilityOptions,
  sellerGroupId,
  allowMessageComposer = true,
  allowInternal = false,
  onUploaded,
}: Props) {
  const router = useRouter();
  const [caption, setCaption] = useState("");
  const [message, setMessage] = useState("");
  const [visibility, setVisibility] = useState<EvidenceVisibility>(
    visibilityOptions[0] ?? "PARTIES_AND_ADMIN",
  );
  const [isInternal, setIsInternal] = useState(false);
  const [pendingAttachments, setPendingAttachments] = useState<
    PendingAttachment[]
  >([]);
  const [isSaving, startTransition] = useTransition();

  const effectiveVisibility = isInternal ? "ADMIN_ONLY" : visibility;

  return (
    <section className="space-y-4 rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
      <div className="flex items-start gap-3">
        <div className="rounded-2xl bg-sky-100 p-3 text-sky-700 dark:bg-sky-500/10 dark:text-sky-300">
          <UploadCloud className="h-5 w-5" />
        </div>
        <div className="space-y-1">
          <h3 className="text-base font-semibold text-slate-950 dark:text-white">
            Add Dispute Evidence
          </h3>
          <p className="text-sm text-slate-500 dark:text-zinc-400">
            Upload fresh evidence into the active case. Delivery proof already on file can be linked separately.
          </p>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label>Visibility</Label>
          <select
            value={effectiveVisibility}
            disabled={isInternal}
            onChange={(event) =>
              setVisibility(event.target.value as EvidenceVisibility)
            }
            className="w-full rounded-xl border border-input bg-background px-3 py-2 text-sm"
          >
            {visibilityOptions.map((option) => (
              <option key={option} value={option}>
                {labelize(option)}
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-2">
          <Label>Caption</Label>
          <Input
            value={caption}
            onChange={(event) => setCaption(event.target.value)}
            placeholder="Optional evidence caption"
          />
        </div>
      </div>

      {allowInternal ? (
        <label className="flex items-center gap-2 text-sm text-slate-600 dark:text-zinc-300">
          <input
            type="checkbox"
            checked={isInternal}
            onChange={(event) => setIsInternal(event.target.checked)}
          />
          Mark as internal/admin-only evidence
        </label>
      ) : null}

      <div className="rounded-2xl border border-slate-200/80 bg-slate-50/80 p-4 dark:border-zinc-800 dark:bg-zinc-900/60">
        <UploadButton
          endpoint="evidenceFiles"
          appearance={{
            button:
              "ut-ready:bg-[#3c9ee0] ut-ready:hover:bg-[#318bc4] ut-uploading:bg-[#318bc4] ut-button:rounded-xl ut-button:h-10 ut-button:px-4 ut-button:text-sm ut-button:font-semibold",
          }}
          onClientUploadComplete={(files) => {
            startTransition(async () => {
              for (const file of files) {
                const result = await createDisputeEvidenceAction({
                  disputeId,
                  sellerGroupId,
                  visibility: effectiveVisibility,
                  isInternal,
                  file: {
                    fileUrl: file.url,
                    fileKey: file.key,
                    fileName: file.name,
                    mimeType: file.type,
                    fileSize: file.size,
                    caption: caption.trim() || undefined,
                  },
                });

                if (result?.error) {
                  toast.error(result.error);
                  return;
                }
              }

              toast.success("Dispute evidence uploaded");
              setCaption("");
              await onUploaded?.();
              router.refresh();
            });
          }}
          onUploadError={(error) => {
            toast.error(error.message);
          }}
        />
      </div>

      {allowMessageComposer ? (
        <div className="space-y-3 rounded-2xl border border-slate-200/80 p-4 dark:border-zinc-800">
          <div className="flex items-center gap-2">
            <MessageSquarePlus className="h-4 w-4 text-slate-500" />
            <p className="text-sm font-medium text-slate-900 dark:text-white">
              Post a case message
            </p>
          </div>
          <Textarea
            value={message}
            onChange={(event) => setMessage(event.target.value)}
            rows={4}
            placeholder="Add case context for the reviewer or the other party."
          />
          <div className="space-y-3 rounded-xl border border-dashed border-slate-200/80 bg-slate-50/70 p-3 dark:border-zinc-800 dark:bg-zinc-900/50">
            <div className="flex items-center justify-between gap-3">
              <p className="text-xs font-medium uppercase tracking-[0.18em] text-slate-500 dark:text-zinc-400">
                Message Attachments
              </p>
              <span className="text-xs text-slate-500 dark:text-zinc-400">
                {pendingAttachments.length}/6 files
              </span>
            </div>
            {pendingAttachments.length ? (
              <div className="space-y-2">
                {pendingAttachments.map((attachment) => (
                  <div
                    key={attachment.fileUrl}
                    className="flex items-center justify-between gap-3 rounded-lg border border-slate-200/80 bg-white px-3 py-2 text-sm dark:border-zinc-800 dark:bg-zinc-950"
                  >
                    <div className="min-w-0">
                      <p className="truncate font-medium text-slate-900 dark:text-white">
                        {attachment.fileName ?? attachment.fileUrl}
                      </p>
                      <p className="text-xs text-slate-500 dark:text-zinc-400">
                        {attachment.mimeType ?? "Unknown file type"}
                      </p>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() =>
                        setPendingAttachments((current) =>
                          current.filter(
                            (item) => item.fileUrl !== attachment.fileUrl,
                          ),
                        )
                      }
                    >
                      Remove
                    </Button>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-slate-500 dark:text-zinc-400">
                Optional. Attach supporting files to this message before posting.
              </p>
            )}
            <UploadButton
              endpoint="evidenceFiles"
              appearance={{
                button:
                  "ut-ready:bg-white ut-ready:text-slate-900 ut-ready:border ut-ready:border-slate-200 ut-ready:hover:bg-slate-50 ut-uploading:bg-slate-100 ut-button:rounded-xl ut-button:h-10 ut-button:px-4 ut-button:text-sm ut-button:font-semibold dark:ut-ready:bg-zinc-950 dark:ut-ready:text-white dark:ut-ready:border-zinc-800 dark:ut-ready:hover:bg-zinc-900",
              }}
              onClientUploadComplete={(files) => {
                setPendingAttachments((current) => {
                  const next = [...current];

                  for (const file of files) {
                    if (next.length >= 6) {
                      break;
                    }

                    if (next.some((item) => item.fileUrl === file.url)) {
                      continue;
                    }

                    next.push({
                      fileUrl: file.url,
                      fileKey: file.key,
                      fileName: file.name,
                      mimeType: file.type,
                      fileSize: file.size,
                    });
                  }

                  return next;
                });
                toast.success("Message attachment uploaded");
              }}
              onUploadError={(error) => {
                toast.error(error.message);
              }}
            />
          </div>
          <Button
            type="button"
            disabled={isSaving || !message.trim()}
            onClick={() =>
              startTransition(async () => {
                const result = await createDisputeMessageAction({
                  disputeId,
                  message: message.trim(),
                  isInternal,
                  attachments: pendingAttachments,
                });

                if (result?.error) {
                  toast.error(result.error);
                  return;
                }

                toast.success("Dispute message posted");
                setMessage("");
                setPendingAttachments([]);
                await onUploaded?.();
                router.refresh();
              })
            }
          >
            {isSaving ? (
              <span className="inline-flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                Posting...
              </span>
            ) : (
              "Post Message"
            )}
          </Button>
        </div>
      ) : null}
    </section>
  );
}
