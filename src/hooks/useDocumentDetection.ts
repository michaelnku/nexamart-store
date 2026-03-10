"use client";

import { useEffect, useRef } from "react";
import { loadOpenCV, OpenCV } from "@/lib/opencvLoader";

type DetectionBox = {
  x: number;
  y: number;
  width: number;
  height: number;
};

type Props = {
  video: HTMLVideoElement | null;
  canvas: HTMLCanvasElement | null;
  onStableCapture?: (imageData: string) => void;
};

export function useDocumentDetection({
  video,
  canvas,
  onStableCapture,
}: Props) {
  const animationRef = useRef<number | null>(null);
  const lastRectRef = useRef<DetectionBox | null>(null);
  const stableStartRef = useRef<number | null>(null);

  useEffect(() => {
    if (!video || !canvas) return;

    const videoEl = video;
    const canvasEl = canvas;

    let running = true;
    let lastRun = 0;

    async function start() {
      const cv: OpenCV = await loadOpenCV();
      const ctx = canvasEl.getContext("2d");

      if (!ctx) return;

      const processFrame = () => {
        if (!running) return;

        const now = Date.now();

        /** throttle detection to ~10fps */
        if (now - lastRun < 100) {
          animationRef.current = requestAnimationFrame(processFrame);
          return;
        }

        lastRun = now;

        if (videoEl.readyState >= 2) {
          canvasEl.width = videoEl.videoWidth;
          canvasEl.height = videoEl.videoHeight;

          ctx.drawImage(videoEl, 0, 0);

          const src = cv.imread(canvasEl);
          const gray = new cv.Mat();
          const edges = new cv.Mat();

          cv.cvtColor(src, gray, cv.COLOR_RGBA2GRAY);
          cv.Canny(gray, edges, 75, 200);

          const contours = new cv.MatVector();
          const hierarchy = new cv.Mat();

          cv.findContours(
            edges,
            contours,
            hierarchy,
            cv.RETR_EXTERNAL,
            cv.CHAIN_APPROX_SIMPLE,
          );

          let bestRect: DetectionBox | null = null;
          let largestArea = 0;

          for (let i = 0; i < contours.size(); i++) {
            const cnt = contours.get(i);
            const rect = cv.boundingRect(cnt);

            const area = rect.width * rect.height;

            if (area > largestArea) {
              largestArea = area;
              bestRect = rect;
            }
          }

          ctx.clearRect(0, 0, canvasEl.width, canvasEl.height);

          if (bestRect) {
            ctx.strokeStyle = "lime";
            ctx.lineWidth = 4;

            ctx.strokeRect(
              bestRect.x,
              bestRect.y,
              bestRect.width,
              bestRect.height,
            );

            /** stability detection */

            const last = lastRectRef.current;

            if (
              last &&
              Math.abs(last.x - bestRect.x) < 10 &&
              Math.abs(last.y - bestRect.y) < 10 &&
              Math.abs(last.width - bestRect.width) < 10 &&
              Math.abs(last.height - bestRect.height) < 10
            ) {
              if (!stableStartRef.current) {
                stableStartRef.current = now;
              }

              if (
                stableStartRef.current &&
                now - stableStartRef.current > 800
              ) {
                const dataUrl = canvasEl.toDataURL("image/jpeg");

                onStableCapture?.(dataUrl);

                stableStartRef.current = null;
              }
            } else {
              stableStartRef.current = null;
            }

            lastRectRef.current = bestRect;
          }

          src.delete();
          gray.delete();
          edges.delete();
          contours.delete();
          hierarchy.delete();
        }

        animationRef.current = requestAnimationFrame(processFrame);
      };

      processFrame();
    }

    start();

    return () => {
      running = false;

      if (animationRef.current !== null) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [video, canvas, onStableCapture]);
}
