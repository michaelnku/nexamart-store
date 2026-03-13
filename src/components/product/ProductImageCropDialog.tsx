"use client";

import { useCallback, useEffect, useState } from "react";
import Cropper, { type Area } from "react-easy-crop";
import "react-easy-crop/react-easy-crop.css";

import { Loader2, RotateCw } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

type ProductImageCropDialogProps = {
  file: File | null;
  imageUrl: string | null;
  open: boolean;
  aspect?: number;
  disabled?: boolean;
  queueCount?: number;
  onCancel: () => void;
  onConfirm: (croppedAreaPixels: Area, rotation: number) => Promise<void> | void;
};

export function ProductImageCropDialog({
  file,
  imageUrl,
  open,
  aspect = 1,
  disabled = false,
  queueCount = 1,
  onCancel,
  onConfirm,
}: ProductImageCropDialogProps) {
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);

  useEffect(() => {
    if (!open) return;

    setCrop({ x: 0, y: 0 });
    setZoom(1);
    setRotation(0);
    setCroppedAreaPixels(null);
  }, [file?.name, open]);

  const handleCropComplete = useCallback(
    (_croppedArea: Area, nextCroppedAreaPixels: Area) => {
      setCroppedAreaPixels(nextCroppedAreaPixels);
    },
    [],
  );

  const handleConfirm = async () => {
    if (!croppedAreaPixels) return;
    await onConfirm(croppedAreaPixels, rotation);
  };

  return (
    <Dialog open={open} onOpenChange={(nextOpen) => !nextOpen && onCancel()}>
      <DialogContent
        className="max-h-[92vh] max-w-4xl overflow-hidden rounded-[28px] border border-slate-200 bg-white p-0 shadow-[0_28px_120px_-48px_rgba(15,23,42,0.55)]"
        showCloseButton={!disabled}
      >
        <DialogHeader className="border-b border-slate-200 bg-[linear-gradient(135deg,#f8fbff_0%,#eff6ff_55%,#ffffff_100%)] px-6 py-5">
          <DialogTitle className="text-xl font-semibold text-slate-950">
            Crop Product Image
          </DialogTitle>
          <DialogDescription className="text-sm text-slate-600">
            Fine-tune each image before upload for a cleaner marketplace presentation.
            {queueCount > 1 ? ` ${queueCount} images remaining in this batch.` : ""}
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-0 lg:grid-cols-[minmax(0,1fr)_320px]">
          <div className="relative min-h-[360px] bg-[radial-gradient(circle_at_top,#0f172a_0%,#020617_75%)] lg:min-h-[560px]">
            {imageUrl ? (
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
          </div>

          <div className="flex flex-col gap-6 bg-white px-6 py-5">
            <div className="space-y-2">
              <p className="text-sm font-medium text-slate-950">
                {file?.name ?? "Selected image"}
              </p>
              <p className="text-xs text-slate-500">
                Square crops keep storefront cards and search results polished.
              </p>
            </div>

            <label className="space-y-3">
              <span className="text-sm font-medium text-slate-700">Zoom</span>
              <input
                aria-label="Adjust crop zoom"
                type="range"
                min={1}
                max={3}
                step={0.05}
                value={zoom}
                disabled={disabled}
                onChange={(event) => setZoom(Number(event.target.value))}
                className="h-2 w-full cursor-pointer appearance-none rounded-full bg-slate-200 accent-[#3c9ee0]"
              />
            </label>

            <label className="space-y-3">
              <span className="text-sm font-medium text-slate-700">Rotation</span>
              <input
                aria-label="Adjust image rotation"
                type="range"
                min={0}
                max={360}
                step={1}
                value={rotation}
                disabled={disabled}
                onChange={(event) => setRotation(Number(event.target.value))}
                className="h-2 w-full cursor-pointer appearance-none rounded-full bg-slate-200 accent-[#3c9ee0]"
              />
            </label>

            <Button
              type="button"
              variant="outline"
              disabled={disabled}
              onClick={() => setRotation((current) => (current + 90) % 360)}
              className="justify-start rounded-2xl border-slate-200"
            >
              <RotateCw className="mr-2 h-4 w-4" />
              Rotate 90 deg
            </Button>

            <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-xs leading-5 text-slate-600">
              Output is optimized to 1200 x 1200 for consistent thumbnails and faster storefront loading.
            </div>
          </div>
        </div>

        <DialogFooter className="border-t border-slate-200 bg-slate-50 px-6 py-4">
          <Button
            type="button"
            variant="outline"
            disabled={disabled}
            onClick={onCancel}
            className="rounded-2xl border-slate-200"
          >
            Cancel
          </Button>
          <Button
            type="button"
            disabled={disabled || !croppedAreaPixels}
            onClick={handleConfirm}
            className="rounded-2xl bg-[#3c9ee0] text-white hover:bg-[#2d8ac8]"
          >
            {disabled ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Processing...
              </>
            ) : (
              "Crop and Upload"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
