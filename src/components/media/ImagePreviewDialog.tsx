"use client";

import Image from "next/image";
import { useEffect, useMemo, useState } from "react";
import { ChevronLeft, ChevronRight, ImageIcon, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

export type MarketplaceMediaPreviewVariant =
  | "product"
  | "logo"
  | "banner"
  | "generic";

export type ImagePreviewItem = {
  src: string;
  alt?: string;
  id?: string;
};

type MarketplaceImagePreviewDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  images: ImagePreviewItem[];
  initialIndex?: number;
  variant?: MarketplaceMediaPreviewVariant;
  title?: string;
  description?: string;
};

function isValidImageSource(src?: string | null) {
  return typeof src === "string" && src.trim().length > 0;
}

function normalizeImages(images: ImagePreviewItem[]) {
  const seen = new Set<string>();

  return images.filter((image) => {
    if (!isValidImageSource(image.src)) return false;

    const key = image.id ?? image.src.trim();
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function getImageFitClassName(variant: MarketplaceMediaPreviewVariant) {
  if (variant === "logo") return "object-contain";
  if (variant === "banner") return "object-contain";
  return "object-contain";
}

function getFrameClassName(variant: MarketplaceMediaPreviewVariant) {
  if (variant === "banner") return "aspect-[16/9]";
  if (variant === "logo") return "aspect-square";
  if (variant === "product") return "aspect-square";
  return "aspect-[4/3]";
}

export function MarketplaceImagePreviewDialog({
  open,
  onOpenChange,
  images,
  initialIndex = 0,
  variant = "generic",
  title = "Image Preview",
  description,
}: MarketplaceImagePreviewDialogProps) {
  const normalizedImages = useMemo(() => normalizeImages(images), [images]);
  const [currentIndex, setCurrentIndex] = useState(
    Math.min(initialIndex, Math.max(normalizedImages.length - 1, 0)),
  );
  const [isImageLoading, setIsImageLoading] = useState(true);

  const hasImages = normalizedImages.length > 0;
  const hasMultiple = normalizedImages.length > 1;
  const currentImage = normalizedImages[currentIndex] ?? null;

  useEffect(() => {
    if (!open) return;

    setCurrentIndex(
      Math.min(initialIndex, Math.max(normalizedImages.length - 1, 0)),
    );
  }, [initialIndex, normalizedImages.length, open]);

  useEffect(() => {
    if (!open || !hasMultiple) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "ArrowRight") {
        event.preventDefault();
        setCurrentIndex((current) => (current + 1) % normalizedImages.length);
      }

      if (event.key === "ArrowLeft") {
        event.preventDefault();
        setCurrentIndex(
          (current) =>
            (current - 1 + normalizedImages.length) % normalizedImages.length,
        );
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [hasMultiple, normalizedImages.length, open]);

  useEffect(() => {
    setIsImageLoading(true);
  }, [currentImage?.src]);

  const goToPrevious = () => {
    if (!hasMultiple) return;
    setCurrentIndex(
      (current) =>
        (current - 1 + normalizedImages.length) % normalizedImages.length,
    );
  };

  const goToNext = () => {
    if (!hasMultiple) return;
    setCurrentIndex((current) => (current + 1) % normalizedImages.length);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        showCloseButton={false}
        className="w-[95vw] max-w-5xl overflow-hidden rounded-xl border bg-white p-0"
      >
        <div className="flex items-center justify-between border-b px-4 py-3 sm:px-5">
          <div className="min-w-0">
            <DialogTitle className="truncate text-left text-base font-semibold text-foreground">
              {title}
            </DialogTitle>
            {description ? (
              <DialogDescription className="mt-1 text-left text-sm text-muted-foreground">
                {description}
              </DialogDescription>
            ) : null}
          </div>

          <div className="ml-3 flex items-center gap-2">
            {hasImages ? (
              <span className="hidden text-xs text-muted-foreground sm:inline">
                {currentIndex + 1} / {normalizedImages.length}
              </span>
            ) : null}

            <Button
              type="button"
              size="icon"
              variant="ghost"
              aria-label="Close image preview"
              onClick={() => onOpenChange(false)}
              className="h-8 w-8 rounded-full"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <div className="p-4 sm:p-5">
          {!hasImages ? (
            <div className="flex min-h-[280px] flex-col items-center justify-center rounded-lg border bg-muted/30 px-6 text-center">
              <ImageIcon className="mb-3 h-6 w-6 text-muted-foreground" />
              <p className="text-sm font-medium text-foreground">
                No image available
              </p>
              <p className="mt-1 text-sm text-muted-foreground">
                There is no valid image to preview.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="relative">
                <div
                  className={cn(
                    "relative w-full overflow-hidden rounded-lg border bg-muted/20",
                    getFrameClassName(variant),
                  )}
                >
                  {isImageLoading ? (
                    <div className="absolute inset-0 animate-pulse bg-muted" />
                  ) : null}

                  <Image
                    key={currentImage?.src}
                    src={currentImage?.src ?? ""}
                    alt={currentImage?.alt ?? title}
                    fill
                    sizes="(max-width: 1024px) 90vw, 1000px"
                    className={cn(
                      getImageFitClassName(variant),
                      isImageLoading ? "opacity-0" : "opacity-100",
                    )}
                    onLoad={() => setIsImageLoading(false)}
                  />
                </div>

                {hasMultiple ? (
                  <>
                    <Button
                      type="button"
                      size="icon"
                      variant="secondary"
                      aria-label="Previous image"
                      onClick={goToPrevious}
                      className="absolute left-2 top-1/2 h-9 w-9 -translate-y-1/2 rounded-full"
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </Button>

                    <Button
                      type="button"
                      size="icon"
                      variant="secondary"
                      aria-label="Next image"
                      onClick={goToNext}
                      className="absolute right-2 top-1/2 h-9 w-9 -translate-y-1/2 rounded-full"
                    >
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </>
                ) : null}
              </div>

              {hasMultiple ? (
                <div className="grid grid-cols-4 gap-2 sm:grid-cols-5 md:grid-cols-6">
                  {normalizedImages.map((image, index) => (
                    <button
                      key={image.id ?? image.src}
                      type="button"
                      aria-label={`Preview image ${index + 1}`}
                      onClick={() => setCurrentIndex(index)}
                      className={cn(
                        "relative aspect-square overflow-hidden rounded-md border bg-muted transition",
                        index === currentIndex
                          ? "border-[#3c9ee0] ring-1 ring-[#3c9ee0]"
                          : "hover:border-muted-foreground/30",
                      )}
                    >
                      <Image
                        src={image.src}
                        alt={image.alt ?? `Preview image ${index + 1}`}
                        fill
                        sizes="120px"
                        className={cn(
                          variant === "logo"
                            ? "object-contain"
                            : "object-cover",
                        )}
                      />
                    </button>
                  ))}
                </div>
              ) : null}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

export { MarketplaceImagePreviewDialog as ImagePreviewDialog };
