"use client";

import type { Area } from "react-easy-crop";

const DEFAULT_OUTPUT_TYPE = "image/webp";
const DEFAULT_QUALITY = 0.82;

type ProcessImageOptions = {
  crop: Area;
  rotation?: number;
  targetWidth?: number;
  targetHeight?: number;
  outputType?: string;
  quality?: number;
  fileName?: string;
  transparentBackground?: boolean;
};

function createImageBitmapFromUrl(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new window.Image();
    image.addEventListener("load", () => resolve(image));
    image.addEventListener("error", () =>
      reject(new Error("Unable to load image for cropping.")),
    );
    image.crossOrigin = "anonymous";
    image.src = src;
  });
}

function degreesToRadians(degrees: number) {
  return (degrees * Math.PI) / 180;
}

function getSafeCanvasSize(width: number, height: number, rotation = 0) {
  const radians = degreesToRadians(rotation);
  const sin = Math.abs(Math.sin(radians));
  const cos = Math.abs(Math.cos(radians));

  return {
    width: Math.floor(width * cos + height * sin),
    height: Math.floor(width * sin + height * cos),
  };
}

function canvasToBlob(
  canvas: HTMLCanvasElement,
  type: string,
  quality: number,
): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (!blob) {
          reject(new Error("Failed to export processed image."));
          return;
        }

        resolve(blob);
      },
      type,
      quality,
    );
  });
}

function fileNameToBase(name: string) {
  return name.replace(/\.[^/.]+$/, "").trim() || "product-image";
}

function extensionForMime(type: string) {
  if (type === "image/jpeg") return "jpg";
  if (type === "image/png") return "png";
  return "webp";
}

export async function getCroppedImageFile(
  sourceUrl: string,
  originalFile: File,
  options: ProcessImageOptions,
) {
  const {
    crop,
    rotation = 0,
    targetWidth = 1200,
    targetHeight = 1200,
    outputType = DEFAULT_OUTPUT_TYPE,
    quality = DEFAULT_QUALITY,
    fileName,
    transparentBackground = false,
  } = options;

  const image = await createImageBitmapFromUrl(sourceUrl);
  const safeArea = getSafeCanvasSize(image.width, image.height, rotation);
  const workingCanvas = document.createElement("canvas");
  const workingContext = workingCanvas.getContext("2d");

  if (!workingContext) {
    throw new Error("Canvas is not available in this browser.");
  }

  workingCanvas.width = safeArea.width;
  workingCanvas.height = safeArea.height;

  workingContext.translate(safeArea.width / 2, safeArea.height / 2);
  workingContext.rotate(degreesToRadians(rotation));
  workingContext.translate(-image.width / 2, -image.height / 2);
  workingContext.drawImage(image, 0, 0);

  const cropCanvas = document.createElement("canvas");
  const cropContext = cropCanvas.getContext("2d");

  if (!cropContext) {
    throw new Error("Crop canvas is not available in this browser.");
  }

  cropCanvas.width = crop.width;
  cropCanvas.height = crop.height;

  cropContext.drawImage(
    workingCanvas,
    crop.x,
    crop.y,
    crop.width,
    crop.height,
    0,
    0,
    crop.width,
    crop.height,
  );

  const outputCanvas = document.createElement("canvas");
  const outputContext = outputCanvas.getContext("2d");

  if (!outputContext) {
    throw new Error("Output canvas is not available in this browser.");
  }

  outputCanvas.width = targetWidth;
  outputCanvas.height = targetHeight;

  outputContext.imageSmoothingEnabled = true;
  outputContext.imageSmoothingQuality = "high";

  if (!transparentBackground) {
    outputContext.fillStyle = "#ffffff";
    outputContext.fillRect(0, 0, targetWidth, targetHeight);
  } else {
    outputContext.clearRect(0, 0, targetWidth, targetHeight);
  }

  outputContext.drawImage(cropCanvas, 0, 0, targetWidth, targetHeight);

  let blob = await canvasToBlob(outputCanvas, outputType, quality);

  if (
    blob.size > 4 * 1024 * 1024 &&
    outputType !== "image/jpeg" &&
    !transparentBackground
  ) {
    blob = await canvasToBlob(outputCanvas, "image/jpeg", 0.78);
  }

  if (blob.size > 4 * 1024 * 1024 && !transparentBackground) {
    blob = await canvasToBlob(outputCanvas, "image/jpeg", 0.68);
  }

  const finalType = blob.type || outputType;
  const nextFileName =
    fileName ??
    `${fileNameToBase(originalFile.name)}-processed.${extensionForMime(finalType)}`;

  return new File([blob], nextFileName, {
    type: finalType,
    lastModified: Date.now(),
  });
}
