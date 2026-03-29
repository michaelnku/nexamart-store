import type { Prisma } from "@/generated/prisma";
import type { UserRole } from "@/generated/prisma/client";
import type { OrderDisputeContext } from "@/lib/disputes/disputeService";
import type { DisputePolicy } from "@/lib/disputes/policy";

export type DisputeActionTx = Prisma.TransactionClient;

export type ActiveDispute = NonNullable<OrderDisputeContext["dispute"]>;

export type ResolveDisputeSharedParams = {
  tx: DisputeActionTx;
  order: OrderDisputeContext;
  activeDispute: ActiveDispute;
  policy: DisputePolicy;
  impactedGroupIds: string[];
  orderId: string;
  adminId: string;
  actorRole: UserRole;
};

