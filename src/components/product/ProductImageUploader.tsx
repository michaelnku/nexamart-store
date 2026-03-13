"use client";

import Image from "next/image";
import { useEffect, useMemo, useRef, useState, type ChangeEvent } from "react";
import type { Area } from "react-easy-crop";
import {
  AlertCircle,
  Grip,
  ImagePlus,
  Loader2,
  Sparkles,
  Trash2,
  UploadCloud,
} from "lucide-react";
import { toast } from "sonner";

import { ProductImageCropDialog } from "@/components/product/ProductImageCropDialog";
import { ProductImageEnhancer } from "@/components/product/ProductImageEnhancer";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { getCroppedImageFile } from "@/lib/image/imageCrop";
import type { JsonFile } from "@/lib/types";
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

type QueueItem = {
  file: File;
  previewUrl: string;
};

type ProductImageUploaderProps = {
  value: JsonFile[];
  onChange: (images: JsonFile[]) => void;
  onDelete?: (key: string) => Promise<void> | void;
  maxImages?: number;
  aspect?: number;
  disabled?: boolean;
  storeType?: "GENERAL" | "FOOD";
  onProcessingChange?: (processing: boolean) => void;
};

type EnhancementItem = {
  originalFile: File;
  originalPreviewUrl: string;
};

export function ProductImageUploader({
  value,
  onChange,
  onDelete,
  maxImages = 10,
  aspect = 1,
  disabled = false,
  storeType = "GENERAL",
  onProcessingChange,
}: ProductImageUploaderProps) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const objectUrlsRef = useRef(new Set<string>());
  const [isDragActive, setIsDragActive] = useState(false);
  const [queue, setQueue] = useState<QueueItem[]>([]);
  const [currentItem, setCurrentItem] = useState<QueueItem | null>(null);
  const [enhancementItem, setEnhancementItem] =
    useState<EnhancementItem | null>(null);
  const [processing, setProcessing] = useState(false);
  const [enhancing, setEnhancing] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [deletingKeys, setDeletingKeys] = useState<Set<string>>(new Set());

  const slotsRemaining = Math.max(0, maxImages - value.length);
  const totalBusy = disabled || processing || enhancing;

  useEffect(() => {
    onProcessingChange?.(processing || enhancing);
  }, [enhancing, onProcessingChange, processing]);

  useEffect(() => {
    if (currentItem || queue.length === 0) return;

    const [nextItem, ...rest] = queue;
    setCurrentItem(nextItem ?? null);
    setQueue(rest);
  }, [currentItem, queue]);

  useEffect(() => {
    return () => {
      objectUrlsRef.current.forEach((url) => URL.revokeObjectURL(url));
      objectUrlsRef.current.clear();
    };
  }, []);

  const helperText = useMemo(() => {
    if (slotsRemaining === 0)
      return `You have reached the ${maxImages}-image limit.`;
    return `Crop images for a cleaner marketplace presentation. Up to ${maxImages} images.`;
  }, [maxImages, slotsRemaining]);

  const revokeObjectUrl = (url: string | null | undefined) => {
    if (!url) return;
    URL.revokeObjectURL(url);
    objectUrlsRef.current.delete(url);
  };

  const clearCurrentItem = () => {
    if (currentItem?.previewUrl) {
      revokeObjectUrl(currentItem.previewUrl);
    }

    setCurrentItem(null);
    setUploadProgress(0);
  };

  const clearEnhancementItem = () => {
    setEnhancing(false);

    if (enhancementItem?.originalPreviewUrl) {
      revokeObjectUrl(enhancementItem.originalPreviewUrl);
    }

    setEnhancementItem(null);
    setUploadProgress(0);
  };

  const resetQueue = () => {
    clearCurrentItem();
    clearEnhancementItem();
    setQueue((currentQueue) => {
      currentQueue.forEach((item) => {
        revokeObjectUrl(item.previewUrl);
      });
      return [];
    });
  };

  const enqueueFiles = (fileList: FileList | File[]) => {
    if (totalBusy) return;

    const selectedFiles = Array.from(fileList);

    if (!selectedFiles.length) return;

    if (slotsRemaining <= 0) {
      toast.error(`You can upload up to ${maxImages} images.`);
      return;
    }

    const validFiles: QueueItem[] = [];
    let rejectedCount = 0;

    selectedFiles.slice(0, slotsRemaining).forEach((file) => {
      const isAcceptedType =
        ACCEPTED_IMAGE_TYPES.has(file.type) || file.type.startsWith("image/");

      if (!isAcceptedType) {
        rejectedCount += 1;
        return;
      }

      if (file.size > MAX_SOURCE_FILE_SIZE) {
        rejectedCount += 1;
        toast.error(`${file.name} is too large. Use files under 15 MB.`);
        return;
      }

      const previewUrl = URL.createObjectURL(file);
      objectUrlsRef.current.add(previewUrl);

      validFiles.push({ file, previewUrl });
    });

    if (rejectedCount > 0 && validFiles.length === 0) {
      toast.error("Only supported image files can be cropped and uploaded.");
    }

    if (!validFiles.length) return;

    setQueue((currentQueue) => [...currentQueue, ...validFiles]);
  };

  const handleInputChange = (event: ChangeEvent<HTMLInputElement>) => {
    if (event.target.files) {
      enqueueFiles(event.target.files);
    }

    event.target.value = "";
  };

  const handleCropCancel = () => {
    resetQueue();
    toast.message("Image crop cancelled");
  };

  const handleCropConfirm = async (
    croppedAreaPixels: Area,
    rotation: number,
  ) => {
    if (!currentItem) return;

    setProcessing(true);
    setUploadProgress(0);

    try {
      const processedFile = await getCroppedImageFile(
        currentItem.previewUrl,
        currentItem.file,
        {
          crop: croppedAreaPixels,
          rotation,
          targetWidth: 1200,
          targetHeight: 1200,
        },
      );
      const processedPreviewUrl = URL.createObjectURL(processedFile);
      objectUrlsRef.current.add(processedPreviewUrl);

      clearCurrentItem();
      setEnhancementItem({
        originalFile: processedFile,
        originalPreviewUrl: processedPreviewUrl,
      });
    } catch (error) {
      console.error(error);
      toast.error("Failed to prepare image");
    } finally {
      setProcessing(false);
    }
  };

  const finalizeUpload = async (file: File) => {
    setProcessing(true);
    setEnhancing(false);
    setUploadProgress(0);

    try {
      const response = await uploadFiles("productImages", {
        files: [file],
        onUploadProgress: ({ progress }) => {
          setUploadProgress(Math.max(0, Math.min(100, progress)));
        },
      });

      const uploadedImages = response.map((uploadedFile) => ({
        url: uploadedFile.url,
        key: uploadedFile.key,
      }));

      onChange([...value, ...uploadedImages]);
      clearEnhancementItem();
      clearCurrentItem();
      toast.success("Image uploaded");
    } catch (error) {
      console.error(error);
      toast.error("Failed to process or upload image");
    } finally {
      setProcessing(false);
    }
  };

  const handleDelete = async (key: string) => {
    if (!onDelete || deletingKeys.has(key) || processing || enhancing) return;

    setDeletingKeys((current) => new Set(current).add(key));

    try {
      await onDelete(key);
    } finally {
      setDeletingKeys((current) => {
        const next = new Set(current);
        next.delete(key);
        return next;
      });
    }
  };

  return (
    <div className="space-y-5">
      <ProductImageCropDialog
        open={Boolean(currentItem)}
        file={currentItem?.file ?? null}
        imageUrl={currentItem?.previewUrl ?? null}
        aspect={aspect}
        disabled={processing}
        queueCount={(currentItem ? 1 : 0) + queue.length}
        onCancel={handleCropCancel}
        onConfirm={handleCropConfirm}
      />
      <ProductImageEnhancer
        open={Boolean(enhancementItem)}
        originalFile={enhancementItem?.originalFile ?? null}
        originalPreviewUrl={enhancementItem?.originalPreviewUrl ?? null}
        storeType={storeType}
        disabled={processing}
        onBusyChange={setEnhancing}
        onCancel={() => {
          setEnhancing(false);
          clearEnhancementItem();
          toast.message("Image review cancelled");
        }}
        onConfirm={finalizeUpload}
      />

      <div
        role="button"
        tabIndex={totalBusy || slotsRemaining === 0 ? -1 : 0}
        onClick={() => {
          if (!totalBusy && slotsRemaining > 0) {
            inputRef.current?.click();
          }
        }}
        onKeyDown={(event) => {
          if (
            (event.key === "Enter" || event.key === " ") &&
            !totalBusy &&
            slotsRemaining > 0
          ) {
            event.preventDefault();
            inputRef.current?.click();
          }
        }}
        onDragEnter={(event) => {
          event.preventDefault();
          if (!totalBusy) setIsDragActive(true);
        }}
        onDragOver={(event) => {
          event.preventDefault();
          if (!totalBusy) setIsDragActive(true);
        }}
        onDragLeave={(event) => {
          event.preventDefault();
          if (event.currentTarget.contains(event.relatedTarget as Node)) return;
          setIsDragActive(false);
        }}
        onDrop={(event) => {
          event.preventDefault();
          setIsDragActive(false);
          enqueueFiles(event.dataTransfer.files);
        }}
        aria-disabled={totalBusy || slotsRemaining === 0}
        className={cn(
          "group relative overflow-hidden rounded-[28px] border border-slate-200 bg-[linear-gradient(145deg,#ffffff_0%,#f8fbff_55%,#eef6ff_100%)] p-6 shadow-[0_24px_80px_-56px_rgba(15,23,42,0.45)] transition dark:border-zinc-800 dark:bg-[linear-gradient(145deg,#0f172a_0%,#111827_55%,#020617_100%)] dark:shadow-[0_28px_100px_-58px_rgba(0,0,0,0.75)]",
          isDragActive &&
            "border-[#3c9ee0] shadow-[0_30px_90px_-48px_rgba(60,158,224,0.45)] dark:border-sky-400 dark:shadow-[0_34px_100px_-52px_rgba(56,189,248,0.35)]",
          (totalBusy || slotsRemaining === 0) &&
            "cursor-not-allowed opacity-80",
          !totalBusy &&
            slotsRemaining > 0 &&
            "cursor-pointer hover:border-[#3c9ee0]/50 hover:shadow-[0_32px_90px_-58px_rgba(60,158,224,0.38)] dark:hover:border-sky-400/60 dark:hover:shadow-[0_34px_100px_-54px_rgba(56,189,248,0.3)]",
        )}
      >
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          multiple
          disabled={totalBusy || slotsRemaining === 0}
          onChange={handleInputChange}
          className="hidden"
        />

        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(60,158,224,0.12),transparent_38%),radial-gradient(circle_at_bottom_left,rgba(15,23,42,0.06),transparent_28%)] dark:bg-[radial-gradient(circle_at_top_right,rgba(56,189,248,0.18),transparent_34%),radial-gradient(circle_at_bottom_left,rgba(14,165,233,0.1),transparent_24%)]" />

        <div className="relative flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-start gap-3 sm:gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#3c9ee0] text-white shadow-lg shadow-sky-200/70 sm:h-14 sm:w-14">
              {processing ? (
                <Loader2 className="h-6 w-6 animate-spin" />
              ) : (
                <ImagePlus className="h-5 w-5 shrink-0 sm:h-6 sm:w-6" />
              )}
            </div>
            <div className="min-w-0 flex-1 space-y-1.5">
              <p className="max-w-2xl text-[11px] font-medium uppercase tracking-[0.16em] text-[#3c9ee0] sm:text-xs sm:tracking-[0.24em]">
                Tip: Clean backgrounds improve product visibility and
                conversion.
              </p>
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="text-base font-semibold text-slate-950 dark:text-white sm:text-lg">
                  Product gallery
                </h3>
                <span className="rounded-full border border-sky-200 bg-white px-2.5 py-0.5 text-xs font-medium text-sky-700 dark:border-sky-500/30 dark:bg-sky-500/10 dark:text-sky-200">
                  {value.length}/{maxImages}
                </span>
              </div>
              <p className="max-w-2xl text-sm leading-6 text-slate-600 dark:text-zinc-300">
                {helperText}
              </p>
              <div className="flex flex-wrap gap-2 text-xs text-slate-500 dark:text-zinc-400">
                <span className="inline-flex items-center gap-1 rounded-full bg-white px-2.5 py-1 ring-1 ring-slate-200 dark:bg-zinc-900/80 dark:ring-zinc-700">
                  <Sparkles className="h-3.5 w-3.5 text-[#3c9ee0]" />
                  1:1 thumbnail crop
                </span>
                <span className="inline-flex items-center gap-1 rounded-full bg-white px-2.5 py-1 ring-1 ring-slate-200 dark:bg-zinc-900/80 dark:ring-zinc-700">
                  <UploadCloud className="h-3.5 w-3.5 text-slate-500 dark:text-zinc-400" />
                  Client-side compression
                </span>
              </div>
            </div>
          </div>

          <Button
            type="button"
            disabled={totalBusy || slotsRemaining === 0}
            className="w-full rounded-2xl bg-[#3c9ee0] px-5 text-white hover:bg-[#2d8ac8] sm:w-auto"
            onClick={(event) => {
              event.stopPropagation();
              inputRef.current?.click();
            }}
          >
            <Grip className="mr-2 h-4 w-4" />
            Choose Images
          </Button>
        </div>

        <div className="relative mt-6 rounded-[24px] border border-dashed border-slate-300 bg-white/85 p-8 text-center dark:border-zinc-700 dark:bg-zinc-950/55">
          <div className="mx-auto flex max-w-md flex-col items-center gap-3">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-slate-100 text-slate-700 dark:bg-zinc-900 dark:text-zinc-200">
              <UploadCloud className="h-7 w-7" />
            </div>
            <div className="space-y-1">
              <p className="text-sm font-medium text-slate-900 dark:text-white">
                Drag and drop product images here, or click to browse
              </p>
              <p className="text-xs text-slate-500 dark:text-zinc-400">
                JPG, PNG, WEBP and similar image formats supported. Large source
                files are optimized before upload.
              </p>
            </div>

            {processing ? (
              <div className="mt-3 w-full max-w-xs space-y-2">
                <div className="h-2 overflow-hidden rounded-full bg-slate-200 dark:bg-zinc-800">
                  <div
                    className="h-full rounded-full bg-[#3c9ee0] transition-all"
                    style={{ width: `${uploadProgress}%` }}
                  />
                </div>
                <p className="text-xs text-slate-600 dark:text-zinc-300">
                  Processing and uploading... {Math.round(uploadProgress)}%
                </p>
              </div>
            ) : null}

            {slotsRemaining === 0 ? (
              <div className="mt-2 inline-flex items-center gap-2 rounded-2xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-700 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-200">
                <AlertCircle className="h-4 w-4" />
                Remove an image before adding another.
              </div>
            ) : null}
          </div>
        </div>

        {currentItem ? (
          <div className="relative mt-4 rounded-2xl border border-sky-100 bg-sky-50/70 px-4 py-3 text-sm text-sky-900 dark:border-sky-500/20 dark:bg-sky-500/10 dark:text-sky-100">
            Preparing{" "}
            <span className="font-medium">{currentItem.file.name}</span>
            {queue.length > 0
              ? ` and ${queue.length} more queued image${queue.length > 1 ? "s" : ""}.`
              : "."}
          </div>
        ) : null}
        {enhancementItem ? (
          <div className="relative mt-4 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 dark:border-zinc-700 dark:bg-zinc-900/80 dark:text-zinc-200">
            Review the cropped image and optionally run AI Clean Background
            before upload.
          </div>
        ) : null}
      </div>

      {value.length > 0 ? (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-4">
          {value.map((image, index) => {
            const isDeleting = deletingKeys.has(image.key);

            return (
              <div
                key={image.key}
                className="group relative aspect-square overflow-hidden rounded-[24px] border border-slate-200 bg-slate-100 shadow-[0_18px_48px_-36px_rgba(15,23,42,0.35)] dark:border-zinc-800 dark:bg-zinc-900"
              >
                <Image
                  src={image.url}
                  alt={`Product image ${index + 1}`}
                  fill
                  className={cn(
                    "object-cover transition duration-300 group-hover:scale-[1.03]",
                    isDeleting && "opacity-50",
                  )}
                />

                <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent p-3">
                  <p className="text-xs font-medium text-white">
                    Image {index + 1}
                  </p>
                </div>

                {onDelete ? (
                  <button
                    type="button"
                    aria-label={`Remove image ${index + 1}`}
                    disabled={isDeleting || processing || enhancing}
                    onClick={() => handleDelete(image.key)}
                    className="absolute right-3 top-3 inline-flex h-9 w-9 items-center justify-center rounded-full bg-white/95 text-slate-900 shadow-lg transition hover:bg-white disabled:cursor-not-allowed disabled:opacity-60 dark:bg-zinc-950/90 dark:text-zinc-100 dark:hover:bg-zinc-900"
                  >
                    {isDeleting ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Trash2 className="h-4 w-4" />
                    )}
                  </button>
                ) : null}
              </div>
            );
          })}
        </div>
      ) : null}

      {value.length === 0 ? (
        <p className="text-sm text-slate-500 dark:text-zinc-400">
          No product images uploaded yet.
        </p>
      ) : null}
    </div>
  );
}
