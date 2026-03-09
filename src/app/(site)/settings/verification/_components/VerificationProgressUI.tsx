"use client";

import { CheckCircle, Clock } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { VerificationProgressType } from "@/lib/types/verification";

export default function VerificationProgressUI({
  progress,
}: {
  progress: VerificationProgressType;
}) {
  const firstIncomplete = progress.steps.findIndex((s) => !s.completed);

  return (
    <div className="border rounded-xl p-6 space-y-6 bg-card shadow-sm">
      {/* Header */}
      <div className="space-y-2">
        <h2 className="text-xl font-semibold">Verification Progress</h2>

        <Progress value={progress.progress} className="h-2" />

        <p className="text-sm text-muted-foreground">
          {progress.progress}% completed
        </p>
      </div>

      {/* Steps */}
      <div className="space-y-6">
        {progress.steps.map((step, index) => {
          const isActive = index === firstIncomplete;
          const isLast = index === progress.steps.length - 1;

          return (
            <div key={step.id} className="relative flex items-start gap-4">
              {/* Icon + Connector */}
              <div className="flex flex-col items-center relative">
                {step.completed ? (
                  <CheckCircle className="text-green-500 w-6 h-6 animate-in zoom-in fade-in" />
                ) : (
                  <Clock
                    className={`w-6 h-6 ${
                      isActive
                        ? "text-primary animate-pulse"
                        : "text-muted-foreground"
                    }`}
                  />
                )}

                {/* Connector */}
                {!isLast && (
                  <div className="relative w-[2px] flex-1 mt-1 bg-border overflow-hidden">
                    {step.completed && (
                      <div className="absolute inset-0 bg-green-500 animate-[growLine_0.6s_ease-out]" />
                    )}
                  </div>
                )}
              </div>

              {/* Label */}
              <div className="pt-[2px]">
                <p
                  className={`text-sm transition-colors ${
                    step.completed
                      ? "text-foreground font-medium"
                      : isActive
                        ? "text-primary font-medium"
                        : "text-muted-foreground"
                  }`}
                >
                  {step.label}
                </p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Animation keyframes */}
      <style jsx>{`
        @keyframes growLine {
          from {
            height: 0%;
            opacity: 0.4;
          }
          to {
            height: 100%;
            opacity: 1;
          }
        }
      `}</style>
    </div>
  );
}
