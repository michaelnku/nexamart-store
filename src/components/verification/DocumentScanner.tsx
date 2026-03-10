"use client";

import Webcam from "react-webcam";
import { useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";

import DocumentCropper from "./DocumentCropper";
import { detectDocumentEdges } from "@/lib/detectDocumentEdges";
import { loadOpenCV } from "@/lib/opencvLoader";

type Props = {
  onCapture: (blob: Blob) => void;
};

export default function DocumentScanner({ onCapture }: Props) {
  const webcamRef = useRef<Webcam | null>(null);

  const [processing, setProcessing] = useState(false);
  const [imageSrc, setImageSrc] = useState<string | null>(null);

  const capture = async () => {
    if (processing) return;

    setProcessing(true);

    try {
      const screenshot = webcamRef.current?.getScreenshot();

      if (!screenshot) {
        setProcessing(false);
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
          setProcessing(false);
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
    } finally {
      setProcessing(false);
    }
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

        {/* Guide rectangle */}

        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="w-[80%] h-[50%] border-4 border-lime-500 rounded-lg" />
        </div>
      </div>

      <Button onClick={capture} disabled={processing}>
        {processing ? (
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
