"use server";

import { CurrentRole, CurrentUserId } from "@/lib/currentUser";
import { prisma } from "@/lib/prisma";
import { parseDisputeOpenEvidenceFiles } from "@/lib/evidence/validation";
import {
  normalizeDisputeResolution,
  parseDisputeReason,
} from "@/lib/disputes/policy";
import type { SellerGroupImpactInput } from "@/lib/disputes/disputeService";
import { ensureAdmin } from "@/lib/disputes/actions/disputeAction.guards";
import { openDisputeFlow } from "@/lib/disputes/actions/openDisputeFlow";
import { resolveDisputeFlow } from "@/lib/disputes/actions/resolveDisputeFlow";
import { markReturnShippedFlow } from "@/lib/disputes/actions/markReturnShippedFlow";
import { confirmReturnReceivedFlow } from "@/lib/disputes/actions/confirmReturnReceivedFlow";

export async function raiseOrderDisputeAction(
  orderId: string,
  reasonInput: string,
  description?: string,
  sellerGroupIds?: string[],
  evidenceFiles?: Array<{
    fileUrl: string;
    fileKey?: string | null;
    fileName?: string | null;
    mimeType?: string | null;
    fileSize?: number | null;
    caption?: string | null;
    metadata?: Record<string, unknown> | null;
  }>,
) {
  const userId = await CurrentUserId();
  if (!userId) {
    throw new Error("Unauthorized");
  }

  const parsedReason = parseDisputeReason(reasonInput);
  const reason = parsedReason ?? "OTHER";
  const cleanDescription =
    (description ?? (parsedReason ? "" : reasonInput)).trim() || null;
  const parsedEvidenceFiles = parseDisputeOpenEvidenceFiles(evidenceFiles);

  return prisma.$transaction((tx) =>
    openDisputeFlow({
      tx,
      orderId,
      userId,
      reason,
      cleanDescription,
      sellerGroupIds,
      parsedEvidenceFiles,
    }),
  );
}

export async function resolveOrderDisputeAction(
  orderId: string,
  resolutionInput: string,
  refundAmount?: number,
  sellerGroupImpacts?: SellerGroupImpactInput[],
) {
  const [role, adminId] = await Promise.all([CurrentRole(), CurrentUserId()]);
  ensureAdmin(role, adminId);

  const resolution = normalizeDisputeResolution(resolutionInput);

  return prisma.$transaction((tx) =>
    resolveDisputeFlow({
      tx,
      orderId,
      resolution,
      refundAmount,
      sellerGroupImpacts,
      adminId,
    }),
  );
}

export async function markReturnShippedAction(
  orderId: string,
  trackingNumber: string,
  carrier?: string,
) {
  const userId = await CurrentUserId();
  if (!userId) {
    throw new Error("Unauthorized");
  }

  const cleanTrackingNumber = trackingNumber.trim();
  if (!cleanTrackingNumber) {
    throw new Error("Tracking number is required");
  }

  return prisma.$transaction((tx) =>
    markReturnShippedFlow({
      tx,
      orderId,
      userId,
      cleanTrackingNumber,
      carrier,
    }),
  );
}

export async function confirmReturnReceivedAction(orderId: string) {
  const [role, adminId] = await Promise.all([CurrentRole(), CurrentUserId()]);
  ensureAdmin(role, adminId);

  return prisma.$transaction((tx) =>
    confirmReturnReceivedFlow({
      tx,
      orderId,
      adminId,
    }),
  );
}
