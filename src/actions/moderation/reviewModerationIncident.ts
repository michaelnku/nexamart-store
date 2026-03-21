"use server";

import { revalidatePath } from "next/cache";
import { ReviewStatus } from "@/generated/prisma/client";
import { createAuditLog } from "@/lib/audit/service";
import { requireModerator } from "@/lib/moderation/guardModerator";
import { prisma } from "@/lib/prisma";

type ReviewActionType = "confirm" | "overturn" | "ignore" | "escalate";

const REVIEW_ACTION_LABELS: Record<ReviewActionType, string> = {
  confirm: "confirmed",
  overturn: "overturned",
  ignore: "ignored",
  escalate: "escalated",
};

function buildModerationState(
  strikeCount: number,
  softBlockedUntil: Date | null,
) {
  if (softBlockedUntil && softBlockedUntil > new Date()) return "SOFT_BLOCKED";
  if (strikeCount >= 3) return "RESTRICTED";
  if (strikeCount >= 1) return "WARNED";
  return "CLEAR";
}

function isPendingHumanReview(reviewStatus: ReviewStatus) {
  return reviewStatus === "PENDING_HUMAN_REVIEW";
}

export async function reviewModerationIncidentAction(
  incidentId: string,
  action: ReviewActionType,
) {
  const currentUser = await requireModerator();

  const moderatorIdentity = await prisma.moderatorIdentity.findFirst({
    where: { userId: currentUser.id },
    select: { id: true },
  });

  if (!moderatorIdentity) {
    throw new Error("Moderator identity not found for current user.");
  }

  await prisma.$transaction(async (tx) => {
    const currentIncident = await tx.moderationIncident.findUnique({
      where: { id: incidentId },
      select: {
        id: true,
        status: true,
        reviewStatus: true,
        strikeWeight: true,
        severity: true,
        decision: true,
        subjectUserId: true,
        targetType: true,
        targetId: true,
      },
    });

    if (!currentIncident) {
      throw new Error("Incident not found.");
    }

    const now = new Date();

    if (action === "confirm") {
      if (
        currentIncident.status !== "OPEN" ||
        !isPendingHumanReview(currentIncident.reviewStatus)
      ) {
        throw new Error(
          "Only open incidents pending human review can be confirmed.",
        );
      }

      const confirmResult = await tx.moderationIncident.updateMany({
        where: {
          id: incidentId,
          status: "OPEN",
          reviewStatus: "PENDING_HUMAN_REVIEW",
        },
        data: {
          status: "RESOLVED",
          reviewStatus: "HUMAN_CONFIRMED",
          reviewerModeratorId: moderatorIdentity.id,
          resolvedAt: now,
        },
      });

      if (confirmResult.count !== 1) {
        throw new Error("Incident review state changed. Refresh and try again.");
      }

      if (currentIncident.subjectUserId) {
        const subjectUser = await tx.user.findUnique({
          where: { id: currentIncident.subjectUserId },
          select: {
            id: true,
            moderationStrikeCount: true,
            moderationRiskScore: true,
            softBlockedUntil: true,
          },
        });

        if (subjectUser) {
          const nextStrikeCount =
            (subjectUser.moderationStrikeCount ?? 0) +
            currentIncident.strikeWeight;
          const nextRiskScore =
            (subjectUser.moderationRiskScore ?? 0) +
            currentIncident.strikeWeight;

          const shouldSoftBlock =
            nextStrikeCount >= 3 || currentIncident.severity === "CRITICAL";
          const softBlockedUntil =
            shouldSoftBlock &&
            (!subjectUser.softBlockedUntil || subjectUser.softBlockedUntil <= now)
              ? new Date(now.getTime() + 1000 * 60 * 60 * 24 * 3)
              : subjectUser.softBlockedUntil;

          await tx.user.update({
            where: { id: subjectUser.id },
            data: {
              moderationStrikeCount: nextStrikeCount,
              moderationRiskScore: nextRiskScore,
              moderationLastIncidentAt: now,
              softBlockedUntil,
              moderationState: buildModerationState(
                nextStrikeCount,
                softBlockedUntil,
              ),
            },
          });

          await tx.userStrikeSnapshot.create({
            data: {
              userId: subjectUser.id,
              totalStrikes: nextStrikeCount,
              riskScore: nextRiskScore,
            },
          });
        }
      }

      await createAuditLog(
        {
          actorId: currentUser.id,
          actorRole: currentUser.role,
          actionType: "MODERATION_INCIDENT_CONFIRMED",
          targetEntityType: "MODERATION_INCIDENT",
          targetEntityId: currentIncident.id,
          summary: `Moderator confirmed incident ${currentIncident.id}.`,
          metadata: {
            targetType: currentIncident.targetType,
            targetId: currentIncident.targetId,
            decision: currentIncident.decision,
            strikeWeight: currentIncident.strikeWeight,
          },
        },
        tx,
      );
    }

    if (action === "overturn") {
      if (
        currentIncident.status !== "OPEN" ||
        !isPendingHumanReview(currentIncident.reviewStatus)
      ) {
        throw new Error(
          "Only open incidents pending human review can be overturned.",
        );
      }

      const overturnResult = await tx.moderationIncident.updateMany({
        where: {
          id: incidentId,
          status: "OPEN",
          reviewStatus: "PENDING_HUMAN_REVIEW",
        },
        data: {
          status: "OVERTURNED",
          reviewStatus: "HUMAN_OVERTURNED",
          reviewerModeratorId: moderatorIdentity.id,
          resolvedAt: now,
        },
      });

      if (overturnResult.count !== 1) {
        throw new Error("Incident review state changed. Refresh and try again.");
      }

      await createAuditLog(
        {
          actorId: currentUser.id,
          actorRole: currentUser.role,
          actionType: "MODERATION_INCIDENT_OVERTURNED",
          targetEntityType: "MODERATION_INCIDENT",
          targetEntityId: currentIncident.id,
          summary: `Moderator overturned incident ${currentIncident.id}.`,
          metadata: {
            targetType: currentIncident.targetType,
            targetId: currentIncident.targetId,
            decision: currentIncident.decision,
          },
        },
        tx,
      );
    }

    if (action === "ignore") {
      if (currentIncident.status !== "OPEN") {
        throw new Error("Only open incidents can be ignored.");
      }

      const ignoreResult = await tx.moderationIncident.updateMany({
        where: {
          id: incidentId,
          status: "OPEN",
        },
        data: {
          status: "IGNORED",
          reviewStatus: "NOT_REQUIRED",
          reviewerModeratorId: moderatorIdentity.id,
          resolvedAt: now,
        },
      });

      if (ignoreResult.count !== 1) {
        throw new Error("Incident review state changed. Refresh and try again.");
      }

      await createAuditLog(
        {
          actorId: currentUser.id,
          actorRole: currentUser.role,
          actionType: "MODERATION_INCIDENT_IGNORED",
          targetEntityType: "MODERATION_INCIDENT",
          targetEntityId: currentIncident.id,
          summary: `Moderator ignored incident ${currentIncident.id}.`,
          metadata: {
            targetType: currentIncident.targetType,
            targetId: currentIncident.targetId,
            previousReviewStatus: currentIncident.reviewStatus,
          },
        },
        tx,
      );
    }

    if (action === "escalate") {
      if (
        currentIncident.status !== "OPEN" ||
        isPendingHumanReview(currentIncident.reviewStatus)
      ) {
        throw new Error(
          "Only open incidents not already pending human review can be escalated.",
        );
      }

      const escalateResult = await tx.moderationIncident.updateMany({
        where: {
          id: incidentId,
          status: "OPEN",
          NOT: { reviewStatus: "PENDING_HUMAN_REVIEW" },
        },
        data: {
          reviewStatus: "PENDING_HUMAN_REVIEW",
          status: "OPEN",
          reviewerModeratorId: moderatorIdentity.id,
          resolvedAt: null,
        },
      });

      if (escalateResult.count !== 1) {
        throw new Error("Incident review state changed. Refresh and try again.");
      }

      await createAuditLog(
        {
          actorId: currentUser.id,
          actorRole: currentUser.role,
          actionType: "MODERATION_INCIDENT_ESCALATED",
          targetEntityType: "MODERATION_INCIDENT",
          targetEntityId: currentIncident.id,
          summary: `Moderator escalated incident ${currentIncident.id}.`,
          metadata: {
            targetType: currentIncident.targetType,
            targetId: currentIncident.targetId,
            previousReviewStatus: currentIncident.reviewStatus,
          },
        },
        tx,
      );
    }
  });

  revalidatePath("/marketplace/dashboard/moderator/incidents");
  revalidatePath(`/marketplace/dashboard/moderator/incidents/${incidentId}`);

  return {
    message: `Incident ${REVIEW_ACTION_LABELS[action]} successfully.`,
  };
}
