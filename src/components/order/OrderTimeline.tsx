import { CheckCircle, Clock } from "lucide-react";
import { cn } from "@/lib/utils";
import { OrderStatus } from "@/generated/prisma/client";

type TimelineItem = {
  id: string;
  status: OrderStatus;
  message?: string | null;
  createdAt: string;
};

export default function OrderTimeline({
  timeline,
}: {
  timeline: TimelineItem[];
}) {
  return (
    <div className="border rounded-xl bg-white p-6 space-y-5">
      <h3 className="font-semibold text-lg">Order Timeline</h3>

      <ol className="space-y-6">
        {timeline.map((item, index) => {
          const isLast = index === timeline.length - 1;

          return (
            <li key={item.id} className="flex gap-4">
              {/* ICON */}
              <div className="flex flex-col items-center">
                <div
                  className={cn(
                    "h-8 w-8 rounded-full flex items-center justify-center",
                    isLast
                      ? "bg-[var(--brand-blue)] text-white"
                      : "bg-gray-200 text-gray-600",
                  )}
                >
                  {isLast ? (
                    <CheckCircle className="h-4 w-4" />
                  ) : (
                    <Clock className="h-4 w-4" />
                  )}
                </div>

                {!isLast && <div className="w-px h-full bg-gray-200 mt-1" />}
              </div>

              {/* CONTENT */}
              <div className="flex-1">
                <p className="font-medium">
                  {item.status.replaceAll("_", " ")}
                </p>

                {item.message && (
                  <p className="text-sm text-gray-600">{item.message}</p>
                )}

                <p className="text-xs text-gray-400 mt-1">
                  {new Date(item.createdAt).toLocaleString()}
                </p>
              </div>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
