"use client";

import { useState } from "react";
import Cropper, { type Area } from "react-easy-crop";
import { Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";

type Props = {
  image: string;
  busy?: boolean;
  onBack: () => void;
  onConfirm: (blob: Blob) => Promise<void> | void;
};

function createImage(source: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error("Failed to load image for cropping."));
    image.src = source;
  });
}

function canvasToBlob(canvas: HTMLCanvasElement): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (!blob) {
          reject(new Error("Failed to generate cropped image."));
          return;
        }

        resolve(blob);
      },
      "image/jpeg",
      0.92,
    );
  });
}

async function cropImage(source: string, area: Area): Promise<Blob> {
  const image = await createImage(source);
  const canvas = document.createElement("canvas");
  const context = canvas.getContext("2d");

  if (!context) {
    throw new Error("Failed to prepare crop canvas.");
  }

  const width = Math.max(1, Math.round(area.width));
  const height = Math.max(1, Math.round(area.height));
  const x = Math.max(0, Math.round(area.x));
  const y = Math.max(0, Math.round(area.y));

  canvas.width = width;
  canvas.height = height;

  context.drawImage(image, x, y, width, height, 0, 0, width, height);

  return canvasToBlob(canvas);
}

export default function DocumentCropper({
  image,
  busy = false,
  onBack,
  onConfirm,
}: Props) {
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);
  const [processing, setProcessing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleConfirm = async () => {
    if (!croppedAreaPixels || processing || busy) {
      return;
    }

    setProcessing(true);
    setErrorMessage(null);

    try {
      const blob = await cropImage(image, croppedAreaPixels);
      await onConfirm(blob);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to crop image.";
      setErrorMessage(message);
    } finally {
      setProcessing(false);
    }
  };

  const disabled = busy || processing;

  return (
    <div className="space-y-4">
      <div className="relative h-[420px] w-full overflow-hidden rounded-xl border bg-black">
        <Cropper
          image={image}
          crop={crop}
          zoom={zoom}
          aspect={1.6}
          objectFit="contain"
          showGrid
          onCropChange={setCrop}
          onZoomChange={setZoom}
          onCropComplete={(_, areaPixels) => setCroppedAreaPixels(areaPixels)}
        />
      </div>

      <div className="space-y-2">
        <label
          htmlFor="document-crop-zoom"
          className="text-sm font-medium text-foreground"
        >
          Zoom
        </label>
        <input
          id="document-crop-zoom"
          type="range"
          min={1}
          max={3}
          step={0.05}
          value={zoom}
          onChange={(event) => setZoom(Number(event.target.value))}
          disabled={disabled}
          className="w-full"
        />
      </div>

      {errorMessage ? (
        <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {errorMessage}
        </div>
      ) : null}

      <div className="flex flex-wrap gap-3">
        <Button type="button" variant="outline" onClick={onBack} disabled={disabled}>
          Retake Photo
        </Button>

        <Button type="button" onClick={handleConfirm} disabled={disabled}>
          {disabled ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Preparing image...
            </>
          ) : (
            "Use This Crop"
          )}
        </Button>
      </div>
    </div>
  );
}
