"use client";

import Webcam from "react-webcam";
import { useRef, useState } from "react";
import { Camera, Loader2, RefreshCcw } from "lucide-react";

import { Button } from "@/components/ui/button";
import DocumentCropper from "./DocumentCropper";
import { detectDocumentEdges, type DocumentDetectionResult } from "@/lib/detectDocumentEdges";
import { loadOpenCV } from "@/lib/opencvLoader";

type Props = {
  disabled?: boolean;
  onCancel?: () => void;
  onCapture: (blob: Blob) => Promise<void> | void;
};

type ScannerPhase = "camera" | "crop";

function waitForImageLoad(image: HTMLImageElement): Promise<void> {
  return new Promise((resolve, reject) => {
    image.onload = () => resolve();
    image.onerror = () => reject(new Error("Failed to load captured image."));
  });
}

function loadImageFromDataUrl(dataUrl: string): Promise<HTMLImageElement> {
  const image = new Image();
  image.src = dataUrl;
  return waitForImageLoad(image).then(() => image);
}

function cropDataUrl(
  image: HTMLImageElement,
  crop: DocumentDetectionResult["crop"],
): string {
  const canvas = document.createElement("canvas");
  const context = canvas.getContext("2d");

  if (!context) {
    throw new Error("Failed to prepare captured image.");
  }

  canvas.width = crop.width;
  canvas.height = crop.height;

  context.drawImage(
    image,
    crop.x,
    crop.y,
    crop.width,
    crop.height,
    0,
    0,
    crop.width,
    crop.height,
  );

  return canvas.toDataURL("image/jpeg", 0.92);
}

export default function DocumentScanner({
  disabled = false,
  onCancel,
  onCapture,
}: Props) {
  const webcamRef = useRef<Webcam | null>(null);
  const [phase, setPhase] = useState<ScannerPhase>("camera");
  const [processing, setProcessing] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleRetake = () => {
    if (processing || submitting) {
      return;
    }

    setCapturedImage(null);
    setErrorMessage(null);
    setPhase("camera");
  };

  const handleCaptureClick = async () => {
    if (processing || submitting || disabled) {
      return;
    }

    setProcessing(true);
    setErrorMessage(null);

    try {
      const screenshot = webcamRef.current?.getScreenshot();

      if (!screenshot) {
        throw new Error("Unable to capture image from camera.");
      }

      const image = await loadImageFromDataUrl(screenshot);
      let nextImage = screenshot;

      try {
        await loadOpenCV();
        const detection = await detectDocumentEdges(image);

        if (detection) {
          nextImage = cropDataUrl(image, detection.crop);
        }
      } catch {
        nextImage = screenshot;
      }

      setCapturedImage(nextImage);
      setPhase("crop");
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Unable to capture the document.";
      setErrorMessage(message);
    } finally {
      setProcessing(false);
    }
  };

  const handleCropConfirm = async (blob: Blob) => {
    setSubmitting(true);
    setErrorMessage(null);

    try {
      await onCapture(blob);
      setCapturedImage(null);
      setPhase("camera");
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Unable to upload captured document.";
      setErrorMessage(message);
    } finally {
      setSubmitting(false);
    }
  };

  if (phase === "crop" && capturedImage) {
    return (
      <DocumentCropper
        image={capturedImage}
        busy={submitting}
        onBack={handleRetake}
        onConfirm={handleCropConfirm}
      />
    );
  }

  return (
    <div className="space-y-4">
      <div className="relative overflow-hidden rounded-xl border bg-black">
        <Webcam
          ref={webcamRef}
          audio={false}
          mirrored={false}
          screenshotFormat="image/jpeg"
          screenshotQuality={0.92}
          forceScreenshotSourceSize
          videoConstraints={{
            facingMode: { ideal: "environment" },
          }}
          onUserMediaError={() => {
            setErrorMessage(
              "Camera access failed. Please allow camera permission and try again.",
            );
          }}
          className="aspect-[4/3] w-full object-cover"
        />

        <div className="pointer-events-none absolute inset-0">
          <div className="absolute inset-0 bg-black/25" />
          <div className="absolute left-1/2 top-1/2 h-[58%] w-[84%] -translate-x-1/2 -translate-y-1/2 rounded-2xl border-2 border-white/90 shadow-[0_0_0_9999px_rgba(0,0,0,0.18)]" />
          <div className="absolute left-1/2 top-1/2 h-[58%] w-[84%] -translate-x-1/2 -translate-y-1/2 rounded-2xl">
            <div className="absolute left-0 top-0 h-8 w-8 rounded-tl-2xl border-l-4 border-t-4 border-lime-400" />
            <div className="absolute right-0 top-0 h-8 w-8 rounded-tr-2xl border-r-4 border-t-4 border-lime-400" />
            <div className="absolute bottom-0 left-0 h-8 w-8 rounded-bl-2xl border-b-4 border-l-4 border-lime-400" />
            <div className="absolute bottom-0 right-0 h-8 w-8 rounded-br-2xl border-b-4 border-r-4 border-lime-400" />
          </div>
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 rounded-full bg-black/55 px-3 py-1 text-xs text-white">
            Align the full document inside the guide, then capture.
          </div>
        </div>
      </div>

      {errorMessage ? (
        <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {errorMessage}
        </div>
      ) : null}

      <div className="flex flex-wrap gap-3">
        <Button
          type="button"
          onClick={handleCaptureClick}
          disabled={disabled || processing || submitting}
        >
          {processing ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Processing capture...
            </>
          ) : (
            <>
              <Camera className="mr-2 h-4 w-4" />
              Capture Document
            </>
          )}
        </Button>

        <Button
          type="button"
          variant="outline"
          onClick={handleRetake}
          disabled={disabled || processing || submitting}
        >
          <RefreshCcw className="mr-2 h-4 w-4" />
          Reset
        </Button>

        {onCancel ? (
          <Button
            type="button"
            variant="ghost"
            onClick={onCancel}
            disabled={disabled || processing || submitting}
          >
            Cancel
          </Button>
        ) : null}
      </div>
    </div>
  );
}
