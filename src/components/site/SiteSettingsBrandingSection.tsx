"use client";

import { Camera } from "lucide-react";

import { CroppedImageUploadField } from "@/components/media/CroppedImageUploadField";
import { SiteLogoPreview } from "@/components/site/SiteLogoPreview";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { JsonFile } from "@/lib/types";

type SiteSettingsBrandingSectionProps = {
  value: JsonFile | null;
  disabled?: boolean;
  onChange: (file: JsonFile | null) => void;
  onDelete: () => Promise<void>;
};

export function SiteSettingsBrandingSection({
  value,
  disabled = false,
  onChange,
  onDelete,
}: SiteSettingsBrandingSectionProps) {
  return (
    <Card>
      <CardHeader className="space-y-3">
        <CardTitle>Branding</CardTitle>
        <div className="flex items-center gap-4">
          <SiteLogoPreview src={value?.url ?? null} alt="Site logo preview" />
          <p className="max-w-md text-sm text-muted-foreground">
            Upload a square logo for public-facing NexaMart branding.
          </p>
        </div>
      </CardHeader>
      <CardContent>
        <CroppedImageUploadField
          label="Site Logo"
          value={value}
          onChange={onChange}
          onDelete={onDelete}
          endpoint="siteLogo"
          aspect={1}
          targetWidth={800}
          targetHeight={800}
          previewWidth={128}
          previewHeight={128}
          previewAlt="Site logo preview"
          helperText="Crop and upload one clean logo. Avoid busy backgrounds and ensure the logo is centered for best results."
          emptyText="Upload a square logo for public-facing NexaMart branding."
          successMessage="Site logo uploaded."
          removeLabel="Remove Logo"
          replaceLabel="Replace Logo"
          uploadLabel="Choose Logo"
          disabled={disabled}
          previewWrapperClassName="hidden"
          emptyIcon={<Camera className="h-6 w-6" />}
          emptyStateClassName="max-w-xl"
          cropDialogDescription="Upload and crop a square logo image."
          allowTransparentBackground
          transparentBackgroundLabel="Keep logo background transparent"
        />
      </CardContent>
    </Card>
  );
}
