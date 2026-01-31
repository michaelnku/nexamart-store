"use client";

import { BrowserQRCodeReader, IScannerControls } from "@zxing/browser";
import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";
import { toast } from "sonner";

export function TrackingQRScanner({
  onResult,
  onClose,
}: {
  onResult: (trackingNumber: string) => void;
  onClose: () => void;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const controlsRef = useRef<IScannerControls | null>(null);
  const scannedRef = useRef(false); // 🔒 scan lock
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const reader = new BrowserQRCodeReader();

    reader
      .decodeFromVideoDevice(undefined, videoRef.current!, (result) => {
        if (!result || scannedRef.current) return;

        scannedRef.current = true;

        // 📳 VIBRATION FEEDBACK (safe)
        if ("vibrate" in navigator) {
          navigator.vibrate([100, 50, 100]); // short-double pulse
        }

        onResult(result.getText());
        toast.success("Tracking code detected");

        controlsRef.current?.stop();
        onClose();
      })
      .then((controls) => {
        controlsRef.current = controls;
      })
      .catch(() => {
        setError("Unable to access camera");
      });

    return () => {
      scannedRef.current = true;
      controlsRef.current?.stop();
    };
  }, [onResult, onClose]);

  return (
    <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-background rounded-xl w-full max-w-sm p-4 space-y-3">
        <div className="flex justify-between items-center">
          <p className="font-medium">Scan Tracking QR</p>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => {
              scannedRef.current = true;
              controlsRef.current?.stop();
              onClose();
            }}
          >
            <X className="w-4 h-4" />
          </Button>
        </div>

        {error ? (
          <p className="text-sm text-red-500">{error}</p>
        ) : (
          <video
            ref={videoRef}
            className="w-full rounded-lg bg-black"
            playsInline
          />
        )}
      </div>
    </div>
  );
}
