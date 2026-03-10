"use client";

import { useEffect, useRef } from "react";
import { loadOpenCV } from "@/lib/opencvLoader";

type DetectionBox = {
  x: number;
  y: number;
  width: number;
  height: number;
};

type Props = {
  video: HTMLVideoElement | null;
  canvas: HTMLCanvasElement | null;
};

export function useDocumentDetection({ video, canvas }: Props) {
  const animationRef = useRef<number | null>(null);

  useEffect(() => {
    if (!video || !canvas) return;

    const videoEl = video;
    const canvasEl = canvas;

    let running = true;

    async function start() {
      const cv = await loadOpenCV();
      const ctx = canvasEl.getContext("2d");

      if (!ctx) return;

      const processFrame = () => {
        if (!running) return;

        if (videoEl.readyState >= 2) {
          canvasEl.width = videoEl.videoWidth;
          canvasEl.height = videoEl.videoHeight;

          ctx.drawImage(videoEl, 0, 0);

          const src = (window.cv as any).imread(canvasEl);
          const gray = new (window.cv as any).Mat();
          const edges = new (window.cv as any).Mat();

          (window.cv as any).cvtColor(
            src,
            gray,
            (window.cv as any).COLOR_RGBA2GRAY,
          );
          (window.cv as any).Canny(gray, edges, 75, 200);

          const contours = new (window.cv as any).MatVector();
          const hierarchy = new (window.cv as any).Mat();

          (window.cv as any).findContours(
            edges,
            contours,
            hierarchy,
            (window.cv as any).RETR_EXTERNAL,
            (window.cv as any).CHAIN_APPROX_SIMPLE,
          );

          let bestRect: DetectionBox | null = null;
          let largestArea = 0;

          for (let i = 0; i < contours.size(); i++) {
            const cnt = contours.get(i);
            const rect = (window.cv as any).boundingRect(cnt);

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
  }, [video, canvas]);
}
