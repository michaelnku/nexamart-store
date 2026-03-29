import { UserRole } from "@/generated/prisma/client";
import {
  ensureActiveDispute,
  getOrderDisputeContext,
} from "@/lib/disputes/disputeService";
import {
  getDisputePolicy,
  isResolutionAllowed,
  type normalizeDisputeResolution,
} from "@/lib/disputes/policy";
import { resolvePartialRefund } from "./resolvePartialRefund";
import { resolveRefundBuyer } from "./resolveRefundBuyer";
import { resolveReleaseToSeller } from "./resolveReleaseToSeller";
import { resolveReturnAndRefund } from "./resolveReturnAndRefund";
import type { DisputeActionTx } from "./disputeAction.types";

type Resolution = ReturnType<typeof normalizeDisputeResolution>;

export async function resolveDisputeFlow({
  tx,
  orderId,
  resolution,
  refundAmount,
  sellerGroupImpacts,
  adminId,
}: {
  tx: DisputeActionTx;
  orderId: string;
  resolution: Resolution;
  refundAmount?: number;
  sellerGroupImpacts?: import("@/lib/disputes/disputeService").SellerGroupImpactInput[];
  adminId: string;
}) {
  const order = await getOrderDisputeContext(tx, orderId);

  if (!order) {
    throw new Error("Order not found");
  }

  const activeDispute = ensureActiveDispute(order);
  const policy = getDisputePolicy(order.isFoodOrder, activeDispute.reason);

  if (!isResolutionAllowed(policy, resolution)) {
    throw new Error("Resolution is not allowed for this dispute");
  }

  const impactedGroupIds = activeDispute.disputeSellerGroupImpacts.length
    ? activeDispute.disputeSellerGroupImpacts.map((impact) => impact.sellerGroupId)
    : order.sellerGroups.map((group) => group.id);

  const params = {
    tx,
    order,
    activeDispute,
    policy,
    impactedGroupIds,
    orderId,
    adminId,
    actorRole: UserRole.ADMIN,
  } as const;

  if (resolution === "RETURN_AND_REFUND") {
    return resolveReturnAndRefund(params);
  }

  if (policy.requiresReturn) {
    throw new Error("This dispute requires a return flow before refund resolution");
  }

  if (resolution === "RELEASE_TO_SELLER") {
    return resolveReleaseToSeller(params);
  }

  if (resolution === "REFUND_BUYER") {
    return resolveRefundBuyer(params);
  }

  if (resolution === "PARTIAL_REFUND") {
    return resolvePartialRefund({
      params,
      refundAmount,
      sellerGroupImpacts,
    });
  }

  throw new Error("Unsupported dispute resolution");
}

