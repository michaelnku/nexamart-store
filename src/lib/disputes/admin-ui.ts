import type { AdminDisputeDetailDTO } from "@/lib/types";

export function getDisputeAttentionBadgeClass(
  level?: AdminDisputeDetailDTO["attentionLevel"],
) {
  switch (level) {
    case "CRITICAL":
      return "border-rose-200 bg-rose-50 text-rose-700 dark:border-rose-900/60 dark:bg-rose-950/30 dark:text-rose-300";
    case "HIGH":
      return "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-900/60 dark:bg-amber-950/30 dark:text-amber-300";
    default:
      return "border-slate-200 bg-slate-50 text-slate-700 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-200";
  }
}
