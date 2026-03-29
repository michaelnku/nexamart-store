"use client";

import Image from "next/image";
import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type ChangeEvent,
  type ReactNode,
} from "react";
import Cropper, { type Area } from "react-easy-crop";
import "react-easy-crop/react-easy-crop.css";
import {
  ImagePlus,
  Loader2,
  RotateCw,
  Trash2,
  UploadCloud,
} from "lucide-react";
import { toast } from "sonner";

import type { OurFileRouter } from "@/app/api/uploadthing/core";
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
import type { JsonFile } from "@/lib/types";
import { cn } from "@/lib/utils";
import { uploadFiles } from "@/utils/uploadthing";

const ACCEPTED_IMAGE_TYPES = new Set([
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp",
  "image/gif",
  "image/heic",
  "image/heif",
]);
const MAX_SOURCE_FILE_SIZE = 15 * 1024 * 1024;

type CroppedImageUploadFieldProps = {
  label: string;
  value: JsonFile | null;
  onChange: (file: JsonFile | null) => void;
  onDelete: () => Promise<void>;
  endpoint: keyof OurFileRouter;
  aspect: number;
  targetWidth: number;
  targetHeight: number;
  previewWidth: number;
  previewHeight: number;
  previewAlt: string;
  helperText: string;
  emptyText: string;
  successMessage: string;
  removeLabel: string;
  replaceLabel?: string;
  uploadLabel?: string;
  disabled?: boolean;
  previewClassName?: string;
  previewWrapperClassName?: string;
  emptyIcon?: ReactNode;
  emptyStateClassName?: string;
  cropDialogDescription?: string;
};

export function CroppedImageUploadField({
  label,
  value,
  onChange,
  onDelete,
  endpoint,
  aspect,
  targetWidth,
  targetHeight,
  previewWidth,
  previewHeight,
  previewAlt,
  helperText,
  emptyText,
  successMessage,
  removeLabel,
  replaceLabel = "Replace Image",
  uploadLabel = "Choose Image",
  disabled = false,
  previewClassName,
  previewWrapperClassName,
  emptyIcon,
  emptyStateClassName,
  cropDialogDescription = "Adjust the framing before upload so the saved image matches the intended placement.",
}: CroppedImageUploadFieldProps) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const objectUrlRef = useRef<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [selectedImageUrl, setSelectedImageUrl] = useState<string | null>(null);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(
    null,
  );
  const [isUploading, setIsUploading] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isApplyingCrop, setIsApplyingCrop] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  const busy = disabled || isUploading || isDeleting || isApplyingCrop;

  const revokeCurrentObjectUrl = useCallback(() => {
    if (!objectUrlRef.current) {
      return;
    }

    URL.revokeObjectURL(objectUrlRef.current);
    objectUrlRef.current = null;
  }, []);

  const resetSelection = useCallback(() => {
    revokeCurrentObjectUrl();
    setSelectedFile(null);
    setSelectedImageUrl(null);
    setCrop({ x: 0, y: 0 });
    setZoom(1);
    setRotation(0);
    setCroppedAreaPixels(null);
    setUploadProgress(0);

    if (inputRef.current) {
      inputRef.current.value = "";
    }
  }, [revokeCurrentObjectUrl]);

  useEffect(() => {
    return () => {
      revokeCurrentObjectUrl();
    };
  }, [revokeCurrentObjectUrl]);

  const openPicker = () => {
    if (!busy) {
      inputRef.current?.click();
    }
  };

  const handleFileSelection = (file: File | null) => {
    if (!file) {
      return;
    }

    const isAcceptedType =
      ACCEPTED_IMAGE_TYPES.has(file.type) || file.type.startsWith("image/");

    if (!isAcceptedType) {
      toast.error("Only supported image files can be cropped and uploaded.");
      return;
    }

    if (file.size > MAX_SOURCE_FILE_SIZE) {
      toast.error("Use an image under 15 MB.");
      return;
    }

    revokeCurrentObjectUrl();

    const previewUrl = URL.createObjectURL(file);
    objectUrlRef.current = previewUrl;

    setSelectedFile(file);
    setSelectedImageUrl(previewUrl);
    setCrop({ x: 0, y: 0 });
    setZoom(1);
    setRotation(0);
    setCroppedAreaPixels(null);
  };

  const handleInputChange = (event: ChangeEvent<HTMLInputElement>) => {
    handleFileSelection(event.target.files?.[0] ?? null);
  };

  const handleCropComplete = useCallback(
    (_croppedArea: Area, nextCroppedAreaPixels: Area) => {
      setCroppedAreaPixels(nextCroppedAreaPixels);
    },
    [],
  );

  const handleConfirmCrop = async () => {
    if (!selectedFile || !selectedImageUrl || !croppedAreaPixels) {
      return;
    }

    setIsApplyingCrop(true);
    setIsUploading(true);
    setUploadProgress(0);

    try {
      const croppedFile = await getCroppedImageFile(
        selectedImageUrl,
        selectedFile,
        {
          crop: croppedAreaPixels,
          rotation,
          targetWidth,
          targetHeight,
          fileName: `${selectedFile.name.replace(/\.[^/.]+$/, "")}-cropped.webp`,
        },
      );

      const response = await uploadFiles(endpoint, {
        files: [croppedFile],
        onUploadProgress: ({ progress }) => {
          setUploadProgress(Math.max(0, Math.min(100, progress)));
        },
      });

      const uploadedFile = response?.[0];

      if (!uploadedFile) {
        throw new Error("Upload did not return a file.");
      }

      onChange({ url: uploadedFile.url, key: uploadedFile.key });
      toast.success(successMessage);
      resetSelection();
    } catch (error) {
      console.error(error);
      toast.error("Failed to crop and upload image");
    } finally {
      setIsApplyingCrop(false);
      setIsUploading(false);
    }
  };

  const handleDelete = async () => {
    if (!value?.key || busy) {
      return;
    }

    setIsDeleting(true);

    try {
      await onDelete();
    } finally {
      setIsDeleting(false);
    }
  };

  const handleCancel = () => {
    if (!busy) {
      resetSelection();
    }
  };

  return (
    <div className="space-y-4">
      <div className="space-y-1">
        <p className="text-sm font-medium text-slate-950 dark:text-white">
          {label}
        </p>
        <p className="text-sm text-slate-500 dark:text-zinc-400">
          {helperText}
        </p>
      </div>

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        disabled={busy}
        onChange={handleInputChange}
        className="hidden"
      />

      <Dialog
        open={Boolean(selectedFile && selectedImageUrl)}
        onOpenChange={(open) => {
          if (!open) {
            handleCancel();
          }
        }}
      >
        <DialogContent
          className="flex h-[90vh] max-h-[90vh] max-w-5xl flex-col overflow-hidden rounded-[28px] border border-slate-200 bg-white p-0 shadow-[0_28px_120px_-48px_rgba(15,23,42,0.55)] dark:border-zinc-800 dark:bg-zinc-950"
          showCloseButton={!busy}
        >
          <DialogHeader className="border-b border-slate-200 bg-[linear-gradient(135deg,#f8fbff_0%,#eff6ff_55%,#ffffff_100%)] px-6 py-5 dark:border-zinc-800 dark:bg-[linear-gradient(135deg,#111827_0%,#0f172a_55%,#020617_100%)]">
            <DialogTitle className="text-xl font-semibold text-slate-950 dark:text-white">
              Crop {label}
            </DialogTitle>
            <DialogDescription className="text-sm text-slate-600 dark:text-zinc-400">
              {cropDialogDescription}
            </DialogDescription>
          </DialogHeader>

          <div className="grid min-h-0 flex-1 gap-0 lg:grid-cols-[minmax(0,1fr)_320px]">
            <div className="relative min-h-[360px] bg-[radial-gradient(circle_at_top,#0f172a_0%,#020617_75%)] lg:min-h-[560px]">
              {selectedImageUrl ? (
                <Cropper
                  image={selectedImageUrl}
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

            <div className="flex flex-col gap-6 bg-white px-6 py-5 dark:bg-zinc-950">
              <div className="space-y-2">
                <p className="text-sm font-medium text-slate-950 dark:text-white">
                  {selectedFile?.name ?? "Selected image"}
                </p>
                <p className="text-xs text-slate-500 dark:text-zinc-400">
                  Output is optimized to {targetWidth} x {targetHeight}.
                </p>
              </div>

              <label className="space-y-3">
                <span className="text-sm font-medium text-slate-700 dark:text-zinc-200">
                  Zoom
                </span>
                <input
                  aria-label={`Adjust ${label} zoom`}
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
                  aria-label={`Adjust ${label} rotation`}
                  type="range"
                  min={0}
                  max={360}
                  step={1}
                  value={rotation}
                  disabled={busy}
                  onChange={(event) => setRotation(Number(event.target.value))}
                  className="h-2 w-full cursor-pointer appearance-none rounded-full bg-slate-200 accent-[#3c9ee0] dark:bg-zinc-800"
                />
              </label>

              <Button
                type="button"
                variant="outline"
                disabled={busy}
                onClick={() => setRotation((current) => (current + 90) % 360)}
                className="justify-start rounded-2xl border-slate-200 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
              >
                <RotateCw className="mr-2 h-4 w-4" />
                Rotate 90 deg
              </Button>

              <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-xs leading-5 text-slate-600 dark:border-zinc-800 dark:bg-zinc-900/70 dark:text-zinc-300">
                Cropping happens before upload, so the saved asset matches the
                preview you approved.
              </div>

              {isUploading ? (
                <div className="space-y-2 rounded-2xl border border-sky-100 bg-sky-50 px-4 py-3 dark:border-sky-500/20 dark:bg-sky-500/10">
                  <div className="h-2 overflow-hidden rounded-full bg-slate-200 dark:bg-zinc-800">
                    <div
                      className="h-full rounded-full bg-[#3c9ee0] transition-all"
                      style={{ width: `${uploadProgress}%` }}
                    />
                  </div>
                  <p className="text-xs text-sky-900 dark:text-sky-100">
                    Uploading cropped image... {Math.round(uploadProgress)}%
                  </p>
                </div>
              ) : null}
            </div>
          </div>

          <DialogFooter className="shrink-0 border-t border-slate-200 bg-slate-50 px-6 py-4 dark:border-zinc-800 dark:bg-zinc-950/95">
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
              onClick={handleConfirmCrop}
              className="rounded-2xl bg-[#3c9ee0] text-white hover:bg-[#2d8ac8]"
            >
              {isApplyingCrop || isUploading ? (
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

      {value?.url ? (
        <div className="space-y-3">
          <div className={cn("inline-flex", previewWrapperClassName)}>
            <Image
              src={value.url}
              alt={previewAlt}
              width={previewWidth}
              height={previewHeight}
              className={cn(
                "border border-slate-200 object-cover",
                previewClassName,
              )}
            />
          </div>
          <div className="flex flex-wrap gap-3">
            <Button
              type="button"
              variant="outline"
              disabled={busy}
              onClick={openPicker}
            >
              <UploadCloud className="mr-2 h-4 w-4" />
              {replaceLabel}
            </Button>
            <Button
              type="button"
              variant="destructive"
              disabled={busy}
              onClick={handleDelete}
            >
              {isDeleting ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Trash2 className="mr-2 h-4 w-4" />
              )}
              {removeLabel}
            </Button>
          </div>
        </div>
      ) : (
        <button
          type="button"
          disabled={busy}
          onClick={openPicker}
          className={cn(
            "flex w-full flex-col items-center justify-center gap-3 rounded-[24px] border border-dashed border-slate-300 bg-slate-50/80 px-6 py-10 text-center transition hover:border-[#3c9ee0]/60 hover:bg-sky-50/70 disabled:cursor-not-allowed disabled:opacity-60 dark:border-zinc-700 dark:bg-zinc-900/70 dark:hover:border-sky-400/60 dark:hover:bg-sky-500/10",
            emptyStateClassName,
          )}
        >
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-white text-[#3c9ee0] shadow-sm dark:bg-zinc-950">
            {busy ? (
              <Loader2 className="h-6 w-6 animate-spin" />
            ) : (
              emptyIcon ?? <ImagePlus className="h-6 w-6" />
            )}
          </div>
          <div className="space-y-1">
            <p className="text-sm font-medium text-slate-900 dark:text-white">
              {uploadLabel}
            </p>
            <p className="text-xs text-slate-500 dark:text-zinc-400">
              {emptyText}
            </p>
          </div>
        </button>
      )}
    </div>
  );
}
