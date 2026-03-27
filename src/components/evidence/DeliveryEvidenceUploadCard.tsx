"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import type {
  DeliveryEvidenceType,
  EvidenceVisibility,
} from "@/generated/prisma/client";
import { Loader2, ShieldCheck, UploadCloud } from "lucide-react";
import { toast } from "sonner";

import { createDeliveryEvidenceAction } from "@/actions/order/evidenceActions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { UploadButton } from "@/utils/uploadthing";

type Props = {
  deliveryId: string;
  sellerGroupId?: string | null;
  kindOptions: Array<{
    value: DeliveryEvidenceType;
    label: string;
  }>;
  visibilityOptions: EvidenceVisibility[];
  title?: string;
  description?: string;
  onUploaded?: () => Promise<void> | void;
};

function labelize(value: string) {
  return value.replaceAll("_", " ").toLowerCase().replace(/\b\w/g, (part) => part.toUpperCase());
}

export default function DeliveryEvidenceUploadCard({
  deliveryId,
  sellerGroupId,
  kindOptions,
  visibilityOptions,
  title = "Upload Delivery Proof",
  description = "Attach fulfillment proof using the existing UploadThing flow. Records are validated and stored server-side.",
  onUploaded,
}: Props) {
  const router = useRouter();
  const [kind, setKind] = useState<DeliveryEvidenceType>(kindOptions[0]?.value ?? "DROP_OFF_PROOF");
  const [visibility, setVisibility] = useState<EvidenceVisibility>(
    visibilityOptions[0] ?? "PARTIES_AND_ADMIN",
  );
  const [caption, setCaption] = useState("");
  const [isUploading, startTransition] = useTransition();

  return (
    <section className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
      <div className="flex items-start gap-3">
        <div className="rounded-2xl bg-sky-100 p-3 text-sky-700 dark:bg-sky-500/10 dark:text-sky-300">
          <UploadCloud className="h-5 w-5" />
        </div>
        <div className="space-y-1">
          <h3 className="text-base font-semibold text-slate-950 dark:text-white">
            {title}
          </h3>
          <p className="text-sm text-slate-500 dark:text-zinc-400">
            {description}
          </p>
        </div>
      </div>

      <div className="mt-4 grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label>Proof Type</Label>
          <select
            value={kind}
            onChange={(event) => setKind(event.target.value as DeliveryEvidenceType)}
            className="w-full rounded-xl border border-input bg-background px-3 py-2 text-sm"
          >
            {kindOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-2">
          <Label>Visibility</Label>
          <select
            value={visibility}
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
      </div>

      <div className="mt-4 space-y-2">
        <Label>Caption</Label>
        <Input
          value={caption}
          onChange={(event) => setCaption(event.target.value)}
          placeholder="Optional note about this proof"
        />
      </div>

      <div className="mt-4 rounded-2xl border border-slate-200/80 bg-slate-50/80 p-4 dark:border-zinc-800 dark:bg-zinc-900/60">
        <div className="mb-3 flex items-start gap-2 text-xs text-slate-500 dark:text-zinc-400">
          <ShieldCheck className="mt-0.5 h-4 w-4" />
          <p>Allowed files: images, PDF, and short video clips. Final record creation happens on the server after upload completes.</p>
        </div>

        <UploadButton
          endpoint="evidenceFiles"
          appearance={{
            button:
              "ut-ready:bg-[#3c9ee0] ut-ready:hover:bg-[#318bc4] ut-uploading:bg-[#318bc4] ut-button:rounded-xl ut-button:h-10 ut-button:px-4 ut-button:text-sm ut-button:font-semibold",
          }}
          onClientUploadComplete={(files) => {
            startTransition(async () => {
              for (const file of files) {
                const result = await createDeliveryEvidenceAction({
                  deliveryId,
                  sellerGroupId,
                  kind,
                  visibility,
                  isInternal: false,
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

              toast.success("Delivery evidence uploaded");
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

      {isUploading ? (
        <div className="mt-3 inline-flex items-center gap-2 text-sm text-slate-500 dark:text-zinc-400">
          <Loader2 className="h-4 w-4 animate-spin" />
          Saving evidence...
        </div>
      ) : null}
    </section>
  );
}
