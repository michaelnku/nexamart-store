"use client";

import Image from "next/image";
import { useMemo, useState, type ReactNode } from "react";
import { ImageIcon } from "lucide-react";

import {
  MarketplaceImagePreviewDialog,
  type ImagePreviewItem,
  type MarketplaceMediaPreviewVariant,
} from "@/components/media/ImagePreviewDialog";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type MarketplaceImagePreviewProps = {
  images: ImagePreviewItem[];
  initialIndex?: number;
  variant?: MarketplaceMediaPreviewVariant;
  title?: string;
  description?: string;
  disabled?: boolean;
  children?: ReactNode;
  triggerClassName?: string;
  imageClassName?: string;
  emptyLabel?: string;
};

type SingleImagePreviewProps = Omit<MarketplaceImagePreviewProps, "images"> & {
  src?: string | null;
  alt?: string;
};

function hasValidSource(src?: string | null) {
  return typeof src === "string" && src.trim().length > 0;
}

function getTriggerFrameClassName(variant: MarketplaceMediaPreviewVariant) {
  if (variant === "banner") return "aspect-[16/7]";
  if (variant === "logo") return "aspect-square";
  if (variant === "product") return "aspect-square";
  return "aspect-[4/3]";
}

function getTriggerImageClassName(variant: MarketplaceMediaPreviewVariant) {
  if (variant === "logo") return "object-contain";
  if (variant === "banner") return "object-cover";
  return "object-cover";
}

function getVariantTitle(variant: MarketplaceMediaPreviewVariant) {
  if (variant === "logo") return "Logo Preview";
  if (variant === "banner") return "Banner Preview";
  if (variant === "product") return "Product Images";
  return "Image Preview";
}

export function MarketplaceImagePreview({
  images,
  initialIndex = 0,
  variant = "generic",
  title,
  description,
  disabled = false,
  children,
  triggerClassName,
  imageClassName,
  emptyLabel = "No image available",
}: MarketplaceImagePreviewProps) {
  const [open, setOpen] = useState(false);

  const normalizedImages = useMemo(
    () => images.filter((image) => hasValidSource(image.src)),
    [images],
  );

  const previewImage =
    normalizedImages[initialIndex] ?? normalizedImages[0] ?? null;
  const isDisabled = disabled || normalizedImages.length === 0;

  return (
    <>
      <button
        type="button"
        disabled={isDisabled}
        aria-label={title ?? getVariantTitle(variant)}
        onClick={() => setOpen(true)}
        className={cn(
          "block w-full overflow-hidden text-left transition",
          !isDisabled &&
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#3c9ee0] focus-visible:ring-offset-2",
          isDisabled && "cursor-not-allowed opacity-70",
          triggerClassName,
        )}
      >
        {children ? (
          children
        ) : previewImage ? (
          <div
            className={cn(
              "relative overflow-hidden rounded-xl border bg-muted",
              getTriggerFrameClassName(variant),
            )}
          >
            <Image
              src={previewImage.src}
              alt={previewImage.alt ?? title ?? getVariantTitle(variant)}
              fill
              sizes="(max-width: 768px) 90vw, 320px"
              className={cn(getTriggerImageClassName(variant), imageClassName)}
            />
          </div>
        ) : (
          <div
            className={cn(
              "flex items-center justify-center rounded-xl border bg-muted",
              getTriggerFrameClassName(variant),
            )}
          >
            <div className="flex flex-col items-center gap-2 px-4 text-center text-muted-foreground">
              <ImageIcon className="h-5 w-5" />
              <p className="text-sm">{emptyLabel}</p>
            </div>
          </div>
        )}
      </button>

      <MarketplaceImagePreviewDialog
        open={open}
        onOpenChange={setOpen}
        images={normalizedImages}
        initialIndex={initialIndex}
        variant={variant}
        title={title ?? getVariantTitle(variant)}
        description={description}
      />
    </>
  );
}

export function MarketplaceProductImagePreview(
  props: MarketplaceImagePreviewProps,
) {
  return <MarketplaceImagePreview {...props} variant="product" />;
}

export function MarketplaceLogoImagePreview({
  src,
  alt = "Logo preview",
  ...props
}: SingleImagePreviewProps) {
  return (
    <MarketplaceImagePreview
      {...props}
      variant="logo"
      images={src ? [{ src, alt }] : []}
      title={props.title ?? "Store Logo"}
      emptyLabel={props.emptyLabel ?? "No logo available"}
    />
  );
}

export function MarketplaceBannerImagePreview({
  src,
  alt = "Banner preview",
  ...props
}: SingleImagePreviewProps) {
  return (
    <MarketplaceImagePreview
      {...props}
      variant="banner"
      images={src ? [{ src, alt }] : []}
      title={props.title ?? "Store Banner"}
      emptyLabel={props.emptyLabel ?? "No banner available"}
    />
  );
}

export function MarketplaceImagePreviewButton({
  images,
  initialIndex = 0,
  variant = "generic",
  title,
  description,
  disabled = false,
  children,
}: MarketplaceImagePreviewProps) {
  const [open, setOpen] = useState(false);

  const normalizedImages = useMemo(
    () => images.filter((image) => hasValidSource(image.src)),
    [images],
  );

  return (
    <>
      <Button
        type="button"
        variant="outline"
        disabled={disabled || normalizedImages.length === 0}
        onClick={() => setOpen(true)}
        className="rounded-lg"
      >
        {children ?? "Preview Image"}
      </Button>

      <MarketplaceImagePreviewDialog
        open={open}
        onOpenChange={setOpen}
        images={normalizedImages}
        initialIndex={initialIndex}
        variant={variant}
        title={title ?? getVariantTitle(variant)}
        description={description}
      />
    </>
  );
}

export {
  MarketplaceImagePreview as ImagePreviewTrigger,
  MarketplaceProductImagePreview as ProductImagePreview,
  MarketplaceLogoImagePreview as LogoImagePreview,
  MarketplaceBannerImagePreview as BannerImagePreview,
  MarketplaceImagePreviewButton as ImagePreviewActionButton,
};
