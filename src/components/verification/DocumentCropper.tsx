"use client";

import Cropper from "react-easy-crop";
import { useState } from "react";
import { Button } from "@/components/ui/button";

type CropArea = {
  width: number;
  height: number;
  x: number;
  y: number;
};

type Props = {
  image: string;
  onCropComplete: (blob: Blob) => void;
};

export default function DocumentCropper({ image, onCropComplete }: Props) {
  const [crop, setCrop] = useState<{ x: number; y: number }>({
    x: 0,
    y: 0,
  });

  const [zoom, setZoom] = useState<number>(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<CropArea | null>(
    null,
  );

  const handleCropComplete = (_: unknown, croppedPixels: CropArea) => {
    setCroppedAreaPixels(croppedPixels);
  };

  const createCroppedImage = async () => {
    if (!croppedAreaPixels) return;

    const img = new Image();
    img.src = image;

    await new Promise<void>((resolve) => {
      img.onload = () => resolve();
    });

    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");

    if (!ctx) return;

    canvas.width = croppedAreaPixels.width;
    canvas.height = croppedAreaPixels.height;

    ctx.drawImage(
      img,
      croppedAreaPixels.x,
      croppedAreaPixels.y,
      croppedAreaPixels.width,
      croppedAreaPixels.height,
      0,
      0,
      croppedAreaPixels.width,
      croppedAreaPixels.height,
    );

    canvas.toBlob((blob) => {
      if (blob) onCropComplete(blob);
    }, "image/jpeg");
  };

  return (
    <div className="space-y-4">
      <div className="relative w-full h-80">
        <Cropper
          image={image}
          crop={crop}
          zoom={zoom}
          aspect={1.6}
          onCropChange={setCrop}
          onZoomChange={setZoom}
          onCropComplete={handleCropComplete}
        />
      </div>

      <Button onClick={createCroppedImage}>Confirm Crop</Button>
    </div>
  );
}
