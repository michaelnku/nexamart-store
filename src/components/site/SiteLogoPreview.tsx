"use client";

import Image from "next/image";

import { cn } from "@/lib/utils";

type SiteLogoPreviewProps = {
  src: string | null;
  alt: string;
  className?: string;
};

export function SiteLogoPreview({
  src,
  alt,
  className,
}: SiteLogoPreviewProps) {
  return (
    <div
      className={cn(
        "relative flex h-24 w-24 items-center justify-center overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm",
        className,
      )}
    >
      {src ? (
        <Image src={src} alt={alt} fill className="object-contain p-3" />
      ) : (
        <span className="px-4 text-center text-xs text-slate-500">
          No logo uploaded
        </span>
      )}
    </div>
  );
}
