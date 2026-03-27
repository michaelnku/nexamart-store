"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { Link2, Loader2 } from "lucide-react";
import { toast } from "sonner";

import { linkDeliveryEvidenceToDisputeAction } from "@/actions/order/evidenceActions";
import type { DisputeEvidenceDTO } from "@/lib/types";
import { Button } from "@/components/ui/button";

type Props = {
  disputeId: string;
  deliveryEvidence: DisputeEvidenceDTO[];
  onLinked?: () => Promise<void> | void;
};

export default function LinkedDeliveryEvidenceCard({
  disputeId,
  deliveryEvidence,
  onLinked,
}: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const availableEvidence = deliveryEvidence.filter(
    (item) => item.recordType === "DELIVERY_EVIDENCE" && item.linkedDisputeId !== disputeId,
  );

  if (!availableEvidence.length) {
    return null;
  }

  return (
    <section className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
      <div className="flex items-start gap-3">
        <div className="rounded-2xl bg-slate-100 p-3 text-slate-700 dark:bg-zinc-900 dark:text-zinc-200">
          <Link2 className="h-5 w-5" />
        </div>
        <div>
          <h3 className="text-base font-semibold text-slate-950 dark:text-white">
            Link Existing Delivery Proof
          </h3>
          <p className="text-sm text-slate-500 dark:text-zinc-400">
            Existing fulfillment proof can be attached to this dispute without re-uploading it.
          </p>
        </div>
      </div>

      <div className="mt-4 space-y-3">
        {availableEvidence.map((item) => (
          <div
            key={item.id}
            className="flex flex-col gap-3 rounded-2xl border border-slate-200/80 p-4 dark:border-zinc-800 sm:flex-row sm:items-center sm:justify-between"
          >
            <div className="min-w-0">
              <p className="font-medium text-slate-950 dark:text-white">
                {(item.deliveryKind ?? item.type).replaceAll("_", " ")}
              </p>
              <p className="truncate text-sm text-slate-500 dark:text-zinc-400">
                {item.fileName ?? item.caption ?? item.fileUrl}
              </p>
            </div>
            <Button
              type="button"
              disabled={isPending}
              onClick={() =>
                startTransition(async () => {
                  const result = await linkDeliveryEvidenceToDisputeAction({
                    disputeId,
                    deliveryEvidenceId: item.id,
                  });

                  if (result?.error) {
                    toast.error(result.error);
                    return;
                  }

                  toast.success("Delivery evidence linked to dispute");
                  await onLinked?.();
                  router.refresh();
                })
              }
            >
              {isPending ? (
                <span className="inline-flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Linking...
                </span>
              ) : (
                "Link Evidence"
              )}
            </Button>
          </div>
        ))}
      </div>
    </section>
  );
}
