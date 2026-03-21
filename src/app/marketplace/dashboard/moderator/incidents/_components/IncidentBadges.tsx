import { Badge } from "@/components/ui/badge";

type BadgeTone = "default" | "secondary" | "destructive" | "outline";

function toneFromSeverity(severity: string): BadgeTone {
  if (severity === "CRITICAL" || severity === "HIGH") return "destructive";
  if (severity === "MEDIUM") return "secondary";
  return "outline";
}

function toneFromStatus(status: string): BadgeTone {
  if (status === "RESOLVED") return "default";
  if (status === "OVERTURNED") return "secondary";
  if (status === "IGNORED") return "outline";
  return "destructive";
}

export function SeverityBadge({ severity }: { severity: string }) {
  return <Badge variant={toneFromSeverity(severity)}>{severity}</Badge>;
}

export function StatusBadge({ status }: { status: string }) {
  return <Badge variant={toneFromStatus(status)}>{status}</Badge>;
}

export function ReviewStatusBadge({ reviewStatus }: { reviewStatus: string }) {
  const variant: BadgeTone =
    reviewStatus === "HUMAN_CONFIRMED"
      ? "default"
      : reviewStatus === "HUMAN_OVERTURNED"
        ? "secondary"
        : reviewStatus === "PENDING_HUMAN_REVIEW"
          ? "destructive"
          : "outline";

  return <Badge variant={variant}>{reviewStatus}</Badge>;
}

export function SourceBadge({
  source,
}: {
  source: "AI" | "HUMAN" | "UNKNOWN";
}) {
  const variant: BadgeTone =
    source === "AI" ? "secondary" : source === "HUMAN" ? "default" : "outline";

  return <Badge variant={variant}>{source}</Badge>;
}
