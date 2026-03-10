"use client";

import Webcam from "react-webcam";
import { useRef } from "react";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";

type Props = {
  onCapture: (blob: Blob) => void;
  capturing?: boolean;
};

export default function DocumentScanner({ onCapture, capturing }: Props) {
  const webcamRef = useRef<Webcam | null>(null);

  const capture = async () => {
    const imageSrc = webcamRef.current?.getScreenshot();

    if (!imageSrc) return;

    const blob = await (await fetch(imageSrc)).blob();

    onCapture(blob);
  };

  return (
    <div className="space-y-4">
      <div className="rounded-lg overflow-hidden border">
        <Webcam
          ref={webcamRef}
          screenshotFormat="image/jpeg"
          videoConstraints={{ facingMode: "environment" }}
        />
      </div>

      <Button type="button" onClick={capture} disabled={capturing}>
        {capturing ? (
          <>
            <Loader2 className="animate-spin w-4 h-4 mr-2" />
            Capturing...
          </>
        ) : (
          "Capture Document"
        )}
      </Button>
    </div>
  );
}
