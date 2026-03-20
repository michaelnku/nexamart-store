import { ReferralStatus } from "@/generated/prisma/client";

const referralStatusLabels: Record<ReferralStatus, string> = {
  PENDING_QUALIFICATION: "Pending qualification",
  AWAITING_REWARD: "Awaiting reward",
  PENDING_REWARD: "Awaiting reward",
  REWARDED: "Rewarded",
  EXPIRED: "Expired",
  REJECTED: "Rejected",
  VOID: "Voided",
};

export function getReferralStatusLabel(status: ReferralStatus): string {
  return referralStatusLabels[status];
}

export function getReferralStatusClassName(status: ReferralStatus): string {
  switch (status) {
    case "PENDING_QUALIFICATION":
      return "border-blue-200 bg-blue-50 text-blue-700";
    case "AWAITING_REWARD":
    case "PENDING_REWARD":
      return "border-amber-200 bg-amber-50 text-amber-700";
    case "REWARDED":
      return "border-green-200 bg-green-50 text-green-700";
    case "EXPIRED":
      return "border-zinc-200 bg-zinc-100 text-zinc-700";
    case "REJECTED":
      return "border-rose-200 bg-rose-50 text-rose-700";
    case "VOID":
      return "border-slate-200 bg-slate-100 text-slate-700";
    default:
      return "border-zinc-200 bg-zinc-100 text-zinc-700";
  }
}

export function isReferralAwaitingRewardStatus(status: ReferralStatus): boolean {
  return status === "AWAITING_REWARD" || status === "PENDING_REWARD";
}
