import {
  DisputeReason,
  DisputeResolution,
  DisputeStatus,
} from "@/generated/prisma/client";
import {
  FOOD_DISPUTE_WINDOW_MS,
  GENERAL_DISPUTE_WINDOW_MS,
} from "@/lib/payout/timing";

const RETURN_REQUIRED_REASONS = new Set<DisputeReason>([
  "ITEM_DAMAGED",
  "WRONG_ITEM",
  "NOT_AS_DESCRIBED",
]);

const RIDER_PAYOUT_LOCK_REASONS = new Set<DisputeReason>(["ITEM_NOT_RECEIVED"]);

export type DisputePolicy = {
  disputeWindowMs: number;
  requiresReturn: boolean;
  lockRiderPayout: boolean;
  allowedResolutions: readonly DisputeResolution[];
};

const FOOD_ALLOWED_RESOLUTIONS = [
  "REFUND_BUYER",
  "PARTIAL_REFUND",
  "RELEASE_TO_SELLER",
] as const satisfies readonly DisputeResolution[];

const NON_FOOD_ALLOWED_RESOLUTIONS = [
  "REFUND_BUYER",
  "PARTIAL_REFUND",
  "RELEASE_TO_SELLER",
  "RETURN_AND_REFUND",
] as const satisfies readonly DisputeResolution[];

export function getDisputePolicy(
  isFoodOrder: boolean,
  reason: DisputeReason,
): DisputePolicy {
  const requiresReturn = !isFoodOrder && RETURN_REQUIRED_REASONS.has(reason);

  return {
    disputeWindowMs: isFoodOrder
      ? FOOD_DISPUTE_WINDOW_MS
      : GENERAL_DISPUTE_WINDOW_MS,
    requiresReturn,
    lockRiderPayout: RIDER_PAYOUT_LOCK_REASONS.has(reason),
    allowedResolutions: isFoodOrder
      ? FOOD_ALLOWED_RESOLUTIONS
      : NON_FOOD_ALLOWED_RESOLUTIONS,
  };
}

export function isResolutionAllowed(
  policy: DisputePolicy,
  resolution: DisputeResolution,
): boolean {
  return policy.allowedResolutions.includes(resolution);
}

export function isTerminalDisputeStatus(status: DisputeStatus): boolean {
  return status === "RESOLVED" || status === "REJECTED";
}

export function parseDisputeReason(input: string): DisputeReason | null {
  const normalized = input.trim().toUpperCase();

  switch (normalized) {
    case "ITEM_NOT_RECEIVED":
    case "ITEM_DAMAGED":
    case "WRONG_ITEM":
    case "NOT_AS_DESCRIBED":
    case "MISSING_ITEMS":
    case "OTHER":
      return normalized;
    default:
      return null;
  }
}

export function normalizeDisputeResolution(
  resolution: string,
): DisputeResolution {
  if (resolution === "RELEASE_SELLER") {
    return "RELEASE_TO_SELLER";
  }

  if (
    resolution === "REFUND_BUYER" ||
    resolution === "PARTIAL_REFUND" ||
    resolution === "RELEASE_TO_SELLER" ||
    resolution === "RETURN_AND_REFUND"
  ) {
    return resolution;
  }

  throw new Error("Invalid dispute resolution");
}
