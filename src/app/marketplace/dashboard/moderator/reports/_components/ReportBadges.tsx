import { Badge } from "@/components/ui/badge";

type Variant = "default" | "secondary" | "destructive" | "outline";

function getStatusVariant(status: string): Variant {
  if (status === "OPEN") return "destructive";
  if (status === "UNDER_REVIEW") return "secondary";
  if (status === "RESOLVED") return "default";
  return "outline";
}

export function ReportStatusBadge({ status }: { status: string }) {
  return <Badge variant={getStatusVariant(status)}>{status}</Badge>;
}
