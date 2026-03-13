"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { Loader2, Sparkles, Wand2 } from "lucide-react";
import { toast } from "sonner";

import { cleanProductBackgroundAction } from "@/actions/ai/cleanProductBackground";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

type ProductImageEnhancerProps = {
  open: boolean;
  originalFile: File | null;
  originalPreviewUrl: string | null;
  storeType?: "GENERAL" | "FOOD";
  disabled?: boolean;
  onBusyChange?: (busy: boolean) => void;
  onCancel: () => void;
  onConfirm: (file: File) => Promise<void> | void;
};

type AIResult = {
  file: File;
  previewUrl: string;
};

function fileToDataUrl(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") {
        resolve(reader.result);
        return;
      }

      reject(new Error("Unable to read image file."));
    };
    reader.onerror = () => reject(new Error("Unable to read image file."));
    reader.readAsDataURL(file);
  });
}

async function dataUrlToFile(dataUrl: string, fileName: string, mimeType: string) {
  const response = await fetch(dataUrl);
  const blob = await response.blob();

  return new File([blob], fileName, {
    type: mimeType,
    lastModified: Date.now(),
  });
}

export function ProductImageEnhancer({
  open,
  originalFile,
  originalPreviewUrl,
  storeType = "GENERAL",
  disabled = false,
  onBusyChange,
  onCancel,
  onConfirm,
}: ProductImageEnhancerProps) {
  const requestIdRef = useRef(0);
  const aiObjectUrlRef = useRef<string | null>(null);
  const [aiResult, setAiResult] = useState<AIResult | null>(null);
  const [isEnhancing, setIsEnhancing] = useState(false);
  const [isConfirming, setIsConfirming] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const busy = disabled || isEnhancing || isConfirming;
  const closeLocked = disabled || isConfirming;

  useEffect(() => {
    onBusyChange?.(busy);
  }, [busy, onBusyChange]);

  useEffect(() => {
    return () => {
      onBusyChange?.(false);
    };
  }, [onBusyChange]);

  useEffect(() => {
    requestIdRef.current += 1;
    setError(null);

    if (aiObjectUrlRef.current) {
      URL.revokeObjectURL(aiObjectUrlRef.current);
      aiObjectUrlRef.current = null;
    }

    setAiResult(null);
  }, [originalFile?.name, open]);

  useEffect(() => {
    return () => {
      requestIdRef.current += 1;

      if (aiObjectUrlRef.current) {
        URL.revokeObjectURL(aiObjectUrlRef.current);
      }
    };
  }, []);

  const handleEnhance = async () => {
    if (!originalFile) return;

    const requestId = requestIdRef.current + 1;
    requestIdRef.current = requestId;
    setIsEnhancing(true);
    setError(null);

    try {
      const dataUrl = await fileToDataUrl(originalFile);
      const response = await cleanProductBackgroundAction({
        dataUrl,
        fileName: originalFile.name,
        mimeType: originalFile.type,
      });

      if (requestId !== requestIdRef.current) return;

      if ("error" in response) {
        throw new Error(response.error);
      }

      const { dataUrl: enhancedDataUrl, mimeType } = response;

      if (!enhancedDataUrl || !mimeType) {
        throw new Error("Enhancement failed.");
      }

      const nextFile = await dataUrlToFile(
        enhancedDataUrl,
        originalFile.name.replace(/\.[^/.]+$/, "") + "-clean-background.webp",
        mimeType,
      );
      const nextPreviewUrl = URL.createObjectURL(nextFile);

      if (aiObjectUrlRef.current) {
        URL.revokeObjectURL(aiObjectUrlRef.current);
      }

      aiObjectUrlRef.current = nextPreviewUrl;
      setAiResult({
        file: nextFile,
        previewUrl: nextPreviewUrl,
      });
      toast.success("AI background enhancement ready");
    } catch (actionError) {
      console.error(actionError);
      setError("Unable to enhance the background right now.");
      toast.error("Background enhancement failed");
    } finally {
      if (requestId === requestIdRef.current) {
        setIsEnhancing(false);
      }
    }
  };

  const handleConfirm = async (file: File) => {
    setIsConfirming(true);

    try {
      await onConfirm(file);
    } finally {
      setIsConfirming(false);
    }
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(nextOpen) => {
        if (!closeLocked && !nextOpen) {
          requestIdRef.current += 1;
          onCancel();
        }
      }}
    >
      <DialogContent
        className="max-h-[92vh] max-w-5xl overflow-y-auto rounded-[28px] border border-slate-200 bg-white p-0 shadow-[0_28px_120px_-48px_rgba(15,23,42,0.55)]"
        showCloseButton={!closeLocked}
      >
        <DialogHeader className="border-b border-slate-200 bg-[linear-gradient(135deg,#f8fbff_0%,#eff6ff_55%,#ffffff_100%)] px-6 py-5">
          <DialogTitle className="text-xl font-semibold text-slate-950">
            Review Product Image
          </DialogTitle>
          <DialogDescription className="text-sm text-slate-600">
            Use the cropped image as-is, or optionally clean the background with AI before upload.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5 px-6 py-5">
          <div className="rounded-2xl border border-sky-100 bg-sky-50 px-4 py-3 text-sm text-sky-900">
            <span className="font-medium">AI Clean Background</span> is optional. Your original cropped image is preserved unless you explicitly choose the AI result.
          </div>

          {storeType === "FOOD" ? (
            <Alert className="rounded-2xl border border-amber-200 bg-amber-50 text-amber-900">
              <Sparkles className="h-4 w-4" />
              <AlertTitle>Food photography note</AlertTitle>
              <AlertDescription>
                Natural food photography often performs better than background removal.
              </AlertDescription>
            </Alert>
          ) : null}

          {error ? (
            <Alert className="rounded-2xl border border-red-200 bg-red-50 text-red-900">
              <AlertTitle>Enhancement unavailable</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          ) : null}

          <div className="grid gap-4 lg:grid-cols-2">
            <div className="overflow-hidden rounded-[24px] border border-slate-200 bg-slate-50">
              <div className="border-b border-slate-200 px-4 py-3">
                <p className="text-sm font-semibold text-slate-950">Original</p>
              </div>
              <div className="relative aspect-square">
                {originalPreviewUrl ? (
                  <Image
                    src={originalPreviewUrl}
                    alt="Original cropped product image"
                    fill
                    className="object-cover"
                  />
                ) : null}
              </div>
            </div>

            <div className="overflow-hidden rounded-[24px] border border-slate-200 bg-slate-50">
              <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3">
                <p className="text-sm font-semibold text-slate-950">AI Result</p>
                {aiResult ? (
                  <span className="rounded-full bg-sky-100 px-2.5 py-1 text-xs font-medium text-sky-800">
                    Ready
                  </span>
                ) : null}
              </div>
              <div className="relative flex aspect-square items-center justify-center bg-[radial-gradient(circle_at_top,#f8fbff_0%,#eef2f7_100%)]">
                {aiResult ? (
                  <Image
                    src={aiResult.previewUrl}
                    alt="AI cleaned product image"
                    fill
                    className="object-cover"
                  />
                ) : (
                  <div className="flex max-w-xs flex-col items-center gap-3 px-6 text-center">
                    {isEnhancing ? (
                      <Loader2 className="h-8 w-8 animate-spin text-[#3c9ee0]" />
                    ) : (
                      <Wand2 className="h-8 w-8 text-[#3c9ee0]" />
                    )}
                    <p className="text-sm font-medium text-slate-900">
                      {isEnhancing ? "Enhancing background..." : "No AI image yet"}
                    </p>
                    <p className="text-xs leading-5 text-slate-500">
                      Generate a white or light neutral studio background while keeping the product unchanged.
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="flex flex-wrap gap-3">
            <Button
              type="button"
              variant="outline"
              disabled={busy || !originalFile}
              onClick={handleEnhance}
              className="rounded-2xl border-slate-200"
            >
              {isEnhancing ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Enhancing background...
                </>
              ) : (
                <>
                  <Sparkles className="mr-2 h-4 w-4" />
                  AI Clean Background
                </>
              )}
            </Button>

            {aiResult ? (
              <Button
                type="button"
                variant="outline"
                disabled={busy}
                onClick={handleEnhance}
                className="rounded-2xl border-slate-200"
              >
                Try Again
              </Button>
            ) : null}
          </div>
        </div>

        <DialogFooter className="border-t border-slate-200 bg-slate-50 px-6 py-4">
          <Button
            type="button"
            variant="outline"
            disabled={closeLocked}
            onClick={() => {
              requestIdRef.current += 1;
              onCancel();
            }}
            className="rounded-2xl border-slate-200"
          >
            Cancel
          </Button>
          <Button
            type="button"
            variant="outline"
            disabled={busy || !originalFile}
            onClick={() => originalFile && handleConfirm(originalFile)}
            className="rounded-2xl border-slate-200"
          >
            {isConfirming ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Uploading...
              </>
            ) : (
              "Use Original"
            )}
          </Button>
          <Button
            type="button"
            disabled={busy || !aiResult}
            onClick={() => aiResult && handleConfirm(aiResult.file)}
            className="rounded-2xl bg-[#3c9ee0] text-white hover:bg-[#2d8ac8]"
          >
            {isConfirming ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Uploading...
              </>
            ) : (
              "Use AI Image"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
