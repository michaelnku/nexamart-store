"use client";

import { MarketplaceMediaUploader } from "@/components/media/MarketplaceMediaUploader";
import type { JsonFile } from "@/lib/types";

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

export function ProductImageUploader(props: ProductImageUploaderProps) {
  return (
    <MarketplaceMediaUploader
      {...props}
      endpoint="productImages"
      title="Product gallery"
      tip="Tip: Clean backgrounds improve product visibility and conversion."
      emptyText="No product images uploaded yet."
      uploadButtonText="Choose Images"
      uploadSuccessMessage="Image uploaded"
      queuePrefixText="Preparing"
      previewLabel={(index) => `Image ${index + 1}`}
    />
  );
}
