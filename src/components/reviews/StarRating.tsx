"use client";

import { useState } from "react";
import { Star } from "lucide-react";

interface StarRatingProps {
  value: number;
  onChange?: (rating: number) => void;
  readonly?: boolean;
  size?: "sm" | "md" | "lg";
  className?: string;
}

export default function StarRating({
  value,
  onChange,
  readonly = false,
  size = "lg",
  className,
}: StarRatingProps) {
  const [hover, setHover] = useState<number | null>(null);
  const normalized = Math.max(0, Math.min(5, Number(value || 0)));
  const activeValue = hover ?? normalized;

  const sizeClass =
    size === "sm" ? "h-3.5 w-3.5" : size === "md" ? "h-4 w-4" : "h-5 w-5";

  return (
    <div className={`flex items-center gap-1 ${className ?? ""}`}>
      {[1, 2, 3, 4, 5].map((star) => {
        const active = star <= activeValue;
        const starIcon = (
          <Star
            className={`${sizeClass} ${
              active
                ? "fill-yellow-500 text-yellow-500"
                : "fill-transparent text-gray-300"
            } transition`}
          />
        );

        if (readonly) {
          return <span key={star}>{starIcon}</span>;
        }

        return (
          <button
            key={star}
            type="button"
            onClick={() => onChange?.(star)}
            onMouseEnter={() => setHover(star)}
            onMouseLeave={() => setHover(null)}
            aria-label={`Rate ${star} star${star > 1 ? "s" : ""}`}
            className="transition"
          >
            {starIcon}
          </button>
        );
      })}
    </div>
  );
}
