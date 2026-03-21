import { Badge } from "@/components/ui/badge";

type Variant = "default" | "secondary" | "destructive" | "outline";

function stateVariant(state: string | null): Variant {
  if (state === "SOFT_BLOCKED") return "destructive";
  if (state === "RESTRICTED") return "secondary";
  if (state === "WARNED") return "outline";
  return "default";
}

export function ModerationStateBadge({ state }: { state: string | null }) {
  return <Badge variant={stateVariant(state)}>{state ?? "CLEAR"}</Badge>;
}

export function BlockStatusBadge({
  softBlockedUntil,
}: {
  softBlockedUntil: Date | null;
}) {
  const active = !!softBlockedUntil && new Date(softBlockedUntil) > new Date();

  return (
    <Badge variant={active ? "destructive" : "outline"}>
      {active ? "BLOCKED" : "ACTIVE"}
    </Badge>
  );
}
