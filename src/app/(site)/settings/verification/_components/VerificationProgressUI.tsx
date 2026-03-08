"use client";

import { CheckCircle, Clock } from "lucide-react";
import { Progress } from "@/components/ui/progress";

type Step = {
  id: string;
  label: string;
  completed: boolean;
};

export default function VerificationProgressUI({
  progress,
}: {
  progress: { steps: Step[]; progress: number };
}) {
  return (
    <div className="border rounded-xl p-6 space-y-6 bg-card">
      <div className="space-y-2">
        <h2 className="text-xl font-semibold">Verification Progress</h2>

        <Progress value={progress.progress} />

        <p className="text-sm text-muted-foreground">
          {progress.progress}% completed
        </p>
      </div>

      <div className="space-y-4">
        {progress.steps.map((step) => (
          <div key={step.id} className="flex items-center gap-3">
            {step.completed ? (
              <CheckCircle className="text-green-500 w-5 h-5" />
            ) : (
              <Clock className="text-muted-foreground w-5 h-5" />
            )}

            <span
              className={
                step.completed ? "text-foreground" : "text-muted-foreground"
              }
            >
              {step.label}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
