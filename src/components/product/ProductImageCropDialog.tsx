"use client";

import Image from "next/image";
import { useCallback, useEffect, useRef, useState } from "react";
import Cropper, { type Area } from "react-easy-crop";
import "react-easy-crop/react-easy-crop.css";
import { Loader2, RotateCw, Sparkles, Wand2 } from "lucide-react";
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
import { getCroppedImageFile } from "@/lib/image/imageCrop";

type ProductImageCropDialogProps = {
  file: File | null;
  imageUrl: string | null;
  open: boolean;
  aspect?: number;
  disabled?: boolean;
  queueCount?: number;
  storeType?: "GENERAL" | "FOOD";
  onCancel: () => void;
  onConfirm: (file: File) => Promise<void> | void;
};

type ReviewMode = "edit" | "review";

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

async function dataUrlToFile(
  dataUrl: string,
  fileName: string,
  mimeType: string,
) {
  const response = await fetch(dataUrl);
  const blob = await response.blob();

  return new File([blob], fileName, {
    type: mimeType,
    lastModified: Date.now(),
  });
}

export function ProductImageCropDialog({
  file,
  imageUrl,
  open,
  aspect = 1,
  disabled = false,
  queueCount = 1,
  storeType = "GENERAL",
  onCancel,
  onConfirm,
}: ProductImageCropDialogProps) {
  const aiObjectUrlRef = useRef<string | null>(null);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [mode, setMode] = useState<ReviewMode>("edit");
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);
  const [processedFile, setProcessedFile] = useState<File | null>(null);
  const [processedImageUrl, setProcessedImageUrl] = useState<string | null>(
    null,
  );
  const [aiResult, setAiResult] = useState<AIResult | null>(null);
  const [isApplyingCrop, setIsApplyingCrop] = useState(false);
  const [isEnhancing, setIsEnhancing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const busy = disabled || isApplyingCrop || isEnhancing || isSaving;

  const revokeUrl = useCallback((url: string | null) => {
    if (!url) return;
    URL.revokeObjectURL(url);
  }, []);

  const resetReviewState = useCallback(() => {
    if (processedImageUrl) {
      revokeUrl(processedImageUrl);
    }
    if (aiObjectUrlRef.current) {
      revokeUrl(aiObjectUrlRef.current);
      aiObjectUrlRef.current = null;
    }

    setProcessedFile(null);
    setProcessedImageUrl(null);
    setAiResult(null);
    setError(null);
    setMode("edit");
  }, [processedImageUrl, revokeUrl]);

  useEffect(() => {
    if (!open) return;

    setCrop({ x: 0, y: 0 });
    setZoom(1);
    setRotation(0);
    setMode("edit");
    setCroppedAreaPixels(null);
    setProcessedFile(null);
    setProcessedImageUrl(null);
    setAiResult(null);
    setError(null);
    setIsApplyingCrop(false);
    setIsEnhancing(false);
    setIsSaving(false);
  }, [file?.name, open]);

  useEffect(() => {
    return () => {
      revokeUrl(processedImageUrl);
      if (aiObjectUrlRef.current) {
        revokeUrl(aiObjectUrlRef.current);
      }
    };
  }, [processedImageUrl, revokeUrl]);

  const handleCropComplete = useCallback(
    (_croppedArea: Area, nextCroppedAreaPixels: Area) => {
      setCroppedAreaPixels(nextCroppedAreaPixels);
    },
    [],
  );

  const handleApplyCrop = async () => {
    if (!croppedAreaPixels || !file || !imageUrl) return;

    setIsApplyingCrop(true);
    setError(null);

    try {
      const nextProcessedFile = await getCroppedImageFile(imageUrl, file, {
        crop: croppedAreaPixels,
        rotation,
        targetWidth: 1200,
        targetHeight: 1200,
      });
      const nextProcessedUrl = URL.createObjectURL(nextProcessedFile);

      if (processedImageUrl) {
        revokeUrl(processedImageUrl);
      }
      if (aiObjectUrlRef.current) {
        revokeUrl(aiObjectUrlRef.current);
        aiObjectUrlRef.current = null;
      }

      setProcessedFile(nextProcessedFile);
      setProcessedImageUrl(nextProcessedUrl);
      setAiResult(null);
      setMode("review");
    } catch (applyError) {
      console.error(applyError);
      setError("Unable to generate a preview for this crop.");
      toast.error("Failed to apply crop");
    } finally {
      setIsApplyingCrop(false);
    }
  };

  const handleEnhance = async () => {
    if (!processedFile) return;

    setIsEnhancing(true);
    setError(null);

    try {
      const dataUrl = await fileToDataUrl(processedFile);
      const response = await cleanProductBackgroundAction({
        dataUrl,
        fileName: processedFile.name,
        mimeType: processedFile.type,
      });

      if ("error" in response) {
        throw new Error(response.error);
      }

      const { dataUrl: enhancedDataUrl, mimeType } = response;

      if (!enhancedDataUrl || !mimeType) {
        throw new Error("Enhancement failed.");
      }

      const nextFile = await dataUrlToFile(
        enhancedDataUrl,
        processedFile.name.replace(/\.[^/.]+$/, "") + "-clean-background.webp",
        mimeType,
      );
      const nextPreviewUrl = URL.createObjectURL(nextFile);

      if (aiObjectUrlRef.current) {
        revokeUrl(aiObjectUrlRef.current);
      }

      aiObjectUrlRef.current = nextPreviewUrl;
      setAiResult({ file: nextFile, previewUrl: nextPreviewUrl });
      toast.success("AI background enhancement ready");
    } catch (enhanceError) {
      console.error(enhanceError);
      setError("Unable to enhance the background right now.");
      toast.error("Background enhancement failed");
    } finally {
      setIsEnhancing(false);
    }
  };

  const handleSave = async () => {
    const finalFile = aiResult?.file ?? processedFile;
    if (!finalFile) return;

    setIsSaving(true);

    try {
      await onConfirm(finalFile);
      resetReviewState();
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    if (busy) return;
    resetReviewState();
    onCancel();
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(nextOpen) => !nextOpen && handleCancel()}
    >
      <DialogContent
        className="flex h-[92vh] max-h-[92vh] max-w-5xl flex-col overflow-hidden rounded-[28px] border border-slate-200 bg-white p-0 shadow-[0_28px_120px_-48px_rgba(15,23,42,0.55)] dark:border-zinc-800 dark:bg-zinc-950"
        showCloseButton={!busy}
      >
        <DialogHeader className="border-b border-slate-200 bg-[linear-gradient(135deg,#f8fbff_0%,#eff6ff_55%,#ffffff_100%)] px-6 py-5 dark:border-zinc-800 dark:bg-[linear-gradient(135deg,#111827_0%,#0f172a_55%,#020617_100%)]">
          <DialogTitle className="text-xl font-semibold text-slate-950 dark:text-white">
            {mode === "edit" ? "Crop Product Image" : "Review Product Image"}
          </DialogTitle>
          <DialogDescription className="text-sm text-slate-600 dark:text-zinc-400">
            {mode === "edit"
              ? "Fine-tune each image before upload for a cleaner marketplace presentation."
              : "Review the processed result before saving it to the uploader."}
            {queueCount > 1
              ? ` ${queueCount} images remaining in this batch.`
              : ""}
          </DialogDescription>
        </DialogHeader>

        <div className="min-h-0 flex-1 overflow-y-auto">
          <div className="grid gap-0 lg:grid-cols-[minmax(0,1fr)_320px]">
            <div className="relative min-h-[360px] bg-[radial-gradient(circle_at_top,#0f172a_0%,#020617_75%)] lg:min-h-[560px]">
              {mode === "edit" && imageUrl ? (
                <Cropper
                  image={imageUrl}
                  crop={crop}
                  zoom={zoom}
                  rotation={rotation}
                  aspect={aspect}
                  objectFit="contain"
                  cropShape="rect"
                  showGrid
                  onCropChange={setCrop}
                  onZoomChange={setZoom}
                  onRotationChange={setRotation}
                  onCropComplete={handleCropComplete}
                />
              ) : null}

              {mode === "review" ? (
                <div className="grid h-full gap-4 p-4 lg:grid-cols-2 lg:p-6">
                  <div className="overflow-hidden rounded-[24px] border border-white/10 bg-white/5 backdrop-blur">
                    <div className="border-b border-white/10 px-4 py-3">
                      <p className="text-sm font-semibold text-white">
                        Original Crop
                      </p>
                    </div>
                    <div className="relative aspect-square">
                      {processedImageUrl ? (
                        <Image
                          src={processedImageUrl}
                          alt="Processed cropped product image"
                          fill
                          className="object-contain"
                        />
                      ) : null}
                    </div>
                  </div>

                  <div className="overflow-hidden rounded-[24px] border border-white/10 bg-white/5 backdrop-blur">
                    <div className="flex items-center justify-between border-b border-white/10 px-4 py-3">
                      <p className="text-sm font-semibold text-white">
                        AI Result
                      </p>
                      {aiResult ? (
                        <span className="rounded-full bg-sky-400/15 px-2.5 py-1 text-xs font-medium text-sky-100">
                          Ready
                        </span>
                      ) : null}
                    </div>
                    <div className="relative flex aspect-square items-center justify-center">
                      {aiResult ? (
                        <Image
                          src={aiResult.previewUrl}
                          alt="AI cleaned product image"
                          fill
                          className="object-contain"
                        />
                      ) : (
                        <div className="flex max-w-xs flex-col items-center gap-3 px-6 text-center text-slate-200">
                          {isEnhancing ? (
                            <Loader2 className="h-8 w-8 animate-spin text-[#3c9ee0]" />
                          ) : (
                            <Wand2 className="h-8 w-8 text-[#3c9ee0]" />
                          )}
                          <div className="space-y-1">
                            <p className="text-sm font-medium">
                              AI Clean Background
                            </p>
                            <p className="text-xs text-slate-300">
                              Replace the background with a clean studio-ready
                              surface while preserving the product.
                            </p>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ) : null}
            </div>

            <div className="flex flex-col gap-6 bg-white px-6 py-5 dark:bg-zinc-950">
              <div className="space-y-2">
                <p className="text-sm font-medium text-slate-950 dark:text-white">
                  {file?.name ?? "Selected image"}
                </p>
                <p className="text-xs text-slate-500 dark:text-zinc-400">
                  {mode === "edit"
                    ? "Square crops keep storefront cards and search results polished."
                    : "Save only when you are satisfied with the processed result."}
                </p>
              </div>

              {mode === "edit" ? (
                <>
                  <label className="space-y-3">
                    <span className="text-sm font-medium text-slate-700 dark:text-zinc-200">
                      Zoom
                    </span>
                    <input
                      aria-label="Adjust crop zoom"
                      type="range"
                      min={1}
                      max={3}
                      step={0.05}
                      value={zoom}
                      disabled={busy}
                      onChange={(event) => setZoom(Number(event.target.value))}
                      className="h-2 w-full cursor-pointer appearance-none rounded-full bg-slate-200 accent-[#3c9ee0] dark:bg-zinc-800"
                    />
                  </label>

                  <label className="space-y-3">
                    <span className="text-sm font-medium text-slate-700 dark:text-zinc-200">
                      Rotation
                    </span>
                    <input
                      aria-label="Adjust image rotation"
                      type="range"
                      min={0}
                      max={360}
                      step={1}
                      value={rotation}
                      disabled={busy}
                      onChange={(event) =>
                        setRotation(Number(event.target.value))
                      }
                      className="h-2 w-full cursor-pointer appearance-none rounded-full bg-slate-200 accent-[#3c9ee0] dark:bg-zinc-800"
                    />
                  </label>

                  <Button
                    type="button"
                    variant="outline"
                    disabled={busy}
                    onClick={() =>
                      setRotation((current) => (current + 90) % 360)
                    }
                    className="justify-start rounded-2xl border-slate-200 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
                  >
                    <RotateCw className="mr-2 h-4 w-4" />
                    Rotate 90 deg
                  </Button>
                </>
              ) : (
                <>
                  <div className="rounded-2xl border border-sky-100 bg-sky-50 px-4 py-3 text-sm text-sky-900 dark:border-sky-500/30 dark:bg-sky-500/10 dark:text-sky-100">
                    <span className="font-medium">Review step:</span> apply crop
                    first, then save only when the processed preview looks
                    right.
                  </div>

                  {storeType === "FOOD" ? (
                    <Alert className="rounded-2xl border border-amber-200 bg-amber-50 text-amber-900 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-100">
                      <Sparkles className="h-4 w-4" />
                      <AlertTitle>Food photography note</AlertTitle>
                      <AlertDescription>
                        Natural food photography often performs better than
                        background removal.
                      </AlertDescription>
                    </Alert>
                  ) : null}

                  {error ? (
                    <Alert className="rounded-2xl border border-red-200 bg-red-50 text-red-900 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-100">
                      <AlertTitle>Preview issue</AlertTitle>
                      <AlertDescription>{error}</AlertDescription>
                    </Alert>
                  ) : null}

                  <Button
                    type="button"
                    variant="outline"
                    disabled={busy || !processedFile}
                    onClick={handleEnhance}
                    className="justify-start rounded-2xl border-slate-200 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
                  >
                    {isEnhancing ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <Sparkles className="mr-2 h-4 w-4 text-[#3c9ee0]" />
                    )}
                    AI Clean Background
                  </Button>
                </>
              )}

              <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-xs leading-5 text-slate-600 dark:border-zinc-800 dark:bg-zinc-900/70 dark:text-zinc-300">
                Output is optimized to 1200 x 1200 for consistent thumbnails and
                faster storefront loading.
              </div>
            </div>
          </div>
        </div>

        <DialogFooter className="shrink-0 border-t border-slate-200 bg-slate-50 px-6 py-4 dark:border-zinc-800 dark:bg-zinc-950/95">
          {mode === "edit" ? (
            <>
              <Button
                type="button"
                variant="outline"
                disabled={busy}
                onClick={handleCancel}
                className="rounded-2xl border-slate-200 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
              >
                Cancel
              </Button>
              <Button
                type="button"
                disabled={busy || !croppedAreaPixels}
                onClick={handleApplyCrop}
                className="rounded-2xl bg-[#3c9ee0] text-white hover:bg-[#2d8ac8]"
              >
                {isApplyingCrop ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Applying crop...
                  </>
                ) : (
                  "Apply Crop"
                )}
              </Button>
            </>
          ) : (
            <>
              <Button
                type="button"
                variant="outline"
                disabled={busy}
                onClick={handleCancel}
                className="rounded-2xl border-slate-200 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
              >
                Cancel
              </Button>
              <Button
                type="button"
                variant="outline"
                disabled={busy}
                onClick={() => setMode("edit")}
                className="rounded-2xl border-slate-200 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
              >
                Back to Edit
              </Button>
              <Button
                type="button"
                disabled={busy || (!processedFile && !aiResult)}
                onClick={handleSave}
                className="rounded-2xl bg-[#3c9ee0] text-white hover:bg-[#2d8ac8]"
              >
                {isSaving ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving image...
                  </>
                ) : (
                  "Save Image"
                )}
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
