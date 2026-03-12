import { cn } from "@/lib/utils";
import { DisputeTimelineItem } from "@/lib/disputes/ui";

type Props = {
  items: DisputeTimelineItem[];
  emptyMessage?: string;
};

const toneClassName: Record<NonNullable<DisputeTimelineItem["tone"]>, string> = {
  default: "bg-zinc-300",
  success: "bg-green-500",
  warning: "bg-amber-500",
  danger: "bg-red-500",
};

export default function DisputeTimeline({
  items,
  emptyMessage = "No dispute history available yet.",
}: Props) {
  if (items.length === 0) {
    return <p className="text-sm text-muted-foreground">{emptyMessage}</p>;
  }

  return (
    <div className="space-y-4">
      {items.map((item) => (
        <div key={item.id} className="flex gap-3">
          <div className="flex flex-col items-center">
            <span
              className={cn(
                "mt-1 h-3 w-3 rounded-full",
                toneClassName[item.tone ?? "default"],
              )}
            />
            <span className="mt-1 h-full w-px bg-border" />
          </div>

          <div className="pb-4">
            <p className="font-medium">{item.title}</p>
            {item.description ? (
              <p className="mt-1 text-sm text-muted-foreground">
                {item.description}
              </p>
            ) : null}
            <p className="mt-2 text-xs text-muted-foreground">
              {new Date(item.createdAt).toLocaleString()}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}
