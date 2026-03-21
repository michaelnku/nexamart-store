import { Badge } from "@/components/ui/badge";

type Variant = "default" | "secondary" | "destructive" | "outline";

export function ProductPublishBadge({ published }: { published: boolean }) {
  return (
    <Badge variant={published ? "default" : "secondary"}>
      {published ? "PUBLISHED" : "UNPUBLISHED"}
    </Badge>
  );
}

export function ProductFlagBadge({
  count,
  hasOpenIncident,
}: {
  count: number;
  hasOpenIncident: boolean;
}) {
  const variant: Variant =
    count === 0 ? "outline" : hasOpenIncident ? "destructive" : "secondary";

  return (
    <Badge variant={variant}>
      {count === 0 ? "CLEAN" : `${count} FLAG${count > 1 ? "S" : ""}`}
    </Badge>
  );
}

export function ProductSeverityBadge({
  severity,
}: {
  severity: string | null;
}) {
  if (!severity) {
    return <Badge variant="outline">NONE</Badge>;
  }

  const variant: Variant =
    severity === "CRITICAL" || severity === "HIGH"
      ? "destructive"
      : severity === "MEDIUM"
        ? "secondary"
        : "outline";

  return <Badge variant={variant}>{severity}</Badge>;
}
