"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireModerator } from "@/lib/moderation/guardModerator";

type ReviewActionType = "confirm" | "overturn" | "ignore" | "escalate";

function buildModerationState(
  strikeCount: number,
  softBlockedUntil: Date | null,
) {
  if (softBlockedUntil && softBlockedUntil > new Date()) return "SOFT_BLOCKED";
  if (strikeCount >= 3) return "RESTRICTED";
  if (strikeCount >= 1) return "WARNED";
  return "CLEAR";
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

  const incident = await prisma.moderationIncident.findUnique({
    where: { id: incidentId },
    include: {
      subjectUser: {
        select: {
          id: true,
          moderationStrikeCount: true,
          moderationRiskScore: true,
        },
      },
    },
  });

  if (!incident) {
    throw new Error("Incident not found.");
  }

  await prisma.$transaction(async (tx) => {
    if (action === "confirm") {
      const shouldApplyStrike =
        incident.subjectUserId &&
        incident.status === "OPEN" &&
        incident.reviewStatus === "PENDING_HUMAN_REVIEW";

      if (shouldApplyStrike && incident.subjectUser) {
        const nextStrikeCount =
          (incident.subjectUser.moderationStrikeCount ?? 0) +
          incident.strikeWeight;
        const nextRiskScore =
          (incident.subjectUser.moderationRiskScore ?? 0) +
          incident.strikeWeight;

        const shouldSoftBlock =
          nextStrikeCount >= 3 || incident.severity === "CRITICAL";
        const softBlockedUntil = shouldSoftBlock
          ? new Date(Date.now() + 1000 * 60 * 60 * 24 * 3)
          : null;

        await tx.user.update({
          where: { id: incident.subjectUser.id },
          data: {
            moderationStrikeCount: nextStrikeCount,
            moderationRiskScore: nextRiskScore,
            moderationLastIncidentAt: new Date(),
            softBlockedUntil,
            moderationState: buildModerationState(
              nextStrikeCount,
              softBlockedUntil,
            ),
          },
        });

        await tx.userStrikeSnapshot.create({
          data: {
            userId: incident.subjectUser.id,
            totalStrikes: nextStrikeCount,
            riskScore: nextRiskScore,
          },
        });
      }

      await tx.moderationIncident.update({
        where: { id: incidentId },
        data: {
          status: "RESOLVED",
          reviewStatus: "HUMAN_CONFIRMED",
          reviewerModeratorId: moderatorIdentity.id,
          resolvedAt: new Date(),
        },
      });
    }

    if (action === "overturn") {
      await tx.moderationIncident.update({
        where: { id: incidentId },
        data: {
          status: "OVERTURNED",
          reviewStatus: "HUMAN_OVERTURNED",
          reviewerModeratorId: moderatorIdentity.id,
          resolvedAt: new Date(),
        },
      });
    }

    if (action === "ignore") {
      await tx.moderationIncident.update({
        where: { id: incidentId },
        data: {
          status: "IGNORED",
          reviewerModeratorId: moderatorIdentity.id,
          resolvedAt: new Date(),
        },
      });
    }

    if (action === "escalate") {
      await tx.moderationIncident.update({
        where: { id: incidentId },
        data: {
          reviewStatus: "PENDING_HUMAN_REVIEW",
          status: "OPEN",
          reviewerModeratorId: moderatorIdentity.id,
        },
      });
    }
  });

  revalidatePath("/marketplace/dashboard/moderator/incidents");
  revalidatePath(`/marketplace/dashboard/moderator/incidents/${incidentId}`);
}
