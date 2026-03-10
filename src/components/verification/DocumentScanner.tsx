"use client";

import Webcam from "react-webcam";
import { useRef } from "react";
import { Button } from "@/components/ui/button";

type Props = {
  onCapture: (blob: Blob) => void;
};

export default function DocumentScanner({ onCapture }: Props) {
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
          videoConstraints={{
            facingMode: "environment",
          }}
        />
      </div>

      <Button type="button" onClick={capture}>
        Capture Document
      </Button>
    </div>
  );
}
