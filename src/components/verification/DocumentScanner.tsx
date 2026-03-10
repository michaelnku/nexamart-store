"use client";

import Webcam from "react-webcam";
import { useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";

import DocumentCropper from "./DocumentCropper";
import { detectDocumentEdges } from "@/lib/detectDocument";
import { loadOpenCV } from "@/lib/opencvLoader";
import { useDocumentDetection } from "@/hooks/useDocumentDetection";

type Props = {
  onCapture: (blob: Blob) => void;
};

export default function DocumentScanner({ onCapture }: Props) {
  const webcamRef = useRef<Webcam | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const [capturing, setCapturing] = useState(false);
  const [imageSrc, setImageSrc] = useState<string | null>(null);

  const video =
    webcamRef.current?.video instanceof HTMLVideoElement
      ? webcamRef.current.video
      : null;

  useDocumentDetection({
    video,
    canvas: canvasRef.current,
  });

  const capture = async () => {
    setCapturing(true);

    const screenshot = webcamRef.current?.getScreenshot();

    if (!screenshot) {
      setCapturing(false);
      return;
    }

    const img = new Image();
    img.src = screenshot;

    await new Promise<void>((resolve) => {
      img.onload = () => resolve();
    });

    await loadOpenCV();

    const rect = await detectDocumentEdges(img);

    if (rect) {
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");

      if (!ctx) {
        setCapturing(false);
        return;
      }

      canvas.width = rect.width;
      canvas.height = rect.height;

      ctx.drawImage(
        img,
        rect.x,
        rect.y,
        rect.width,
        rect.height,
        0,
        0,
        rect.width,
        rect.height,
      );

      setImageSrc(canvas.toDataURL("image/jpeg"));
    } else {
      setImageSrc(screenshot);
    }

    setCapturing(false);
  };

  if (imageSrc) {
    return (
      <DocumentCropper
        image={imageSrc}
        onCropComplete={(blob) => {
          setImageSrc(null);
          onCapture(blob);
        }}
      />
    );
  }

  return (
    <div className="space-y-4">
      <div className="relative rounded-lg overflow-hidden border">
        <Webcam
          ref={webcamRef}
          screenshotFormat="image/jpeg"
          videoConstraints={{ facingMode: "environment" }}
          className="w-full"
        />

        {/* Detection Overlay */}

        <canvas
          ref={canvasRef}
          className="absolute inset-0 pointer-events-none"
        />
      </div>

      <Button type="button" onClick={capture} disabled={capturing}>
        {capturing ? (
          <>
            <Loader2 className="animate-spin w-4 h-4 mr-2" />
            Processing...
          </>
        ) : (
          "Capture Document"
        )}
      </Button>
    </div>
  );
}
