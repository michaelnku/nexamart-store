"use server";

import { revalidatePath } from "next/cache";
import { createAuditLog } from "@/lib/audit/service";
import { prisma } from "@/lib/prisma";
import { requireModerator } from "@/lib/moderation/guardModerator";

type ModerationUserAction = "soft_block" | "clear_soft_block" | "reset_summary";

function buildModerationState(
  strikeCount: number,
  softBlockedUntil: Date | null,
): string {
  if (softBlockedUntil && softBlockedUntil > new Date()) return "SOFT_BLOCKED";
  if (strikeCount >= 3) return "RESTRICTED";
  if (strikeCount >= 1) return "WARNED";
  return "CLEAR";
}

export async function manageModerationUserAction(
  userId: string,
  action: ModerationUserAction,
) {
  const currentUser = await requireModerator();

  await prisma.$transaction(async (tx) => {
    const user = await tx.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        moderationStrikeCount: true,
        moderationRiskScore: true,
        softBlockedUntil: true,
        moderationState: true,
      },
    });

    if (!user) {
      throw new Error("User not found.");
    }

    if (action === "soft_block") {
      if (user.softBlockedUntil && user.softBlockedUntil > new Date()) {
        throw new Error("User is already under an active soft block.");
      }

      const softBlockedUntil = new Date(Date.now() + 1000 * 60 * 60 * 24 * 3);

      await tx.user.update({
        where: { id: userId },
        data: {
          softBlockedUntil,
          moderationState: buildModerationState(
            user.moderationStrikeCount ?? 0,
            softBlockedUntil,
          ),
        },
      });

      await createAuditLog(
        {
          actorId: currentUser.id,
          actorRole: currentUser.role,
          actionType: "USER_MODERATION_SOFT_BLOCKED",
          targetEntityType: "USER",
          targetEntityId: user.id,
          summary: `Moderator applied a soft block to user ${user.id}.`,
          metadata: {
            previousState: user.moderationState,
            softBlockedUntil: softBlockedUntil.toISOString(),
          },
        },
        tx,
      );
    }

    if (action === "clear_soft_block") {
      if (!user.softBlockedUntil || user.softBlockedUntil <= new Date()) {
        throw new Error("User does not have an active soft block to clear.");
      }

      const nextState = buildModerationState(
        user.moderationStrikeCount ?? 0,
        null,
      );

      await tx.user.update({
        where: { id: userId },
        data: {
          softBlockedUntil: null,
          moderationState: nextState,
        },
      });

      await createAuditLog(
        {
          actorId: currentUser.id,
          actorRole: currentUser.role,
          actionType: "USER_MODERATION_SOFT_BLOCK_CLEARED",
          targetEntityType: "USER",
          targetEntityId: user.id,
          summary: `Moderator cleared the soft block for user ${user.id}.`,
          metadata: {
            previousState: user.moderationState,
            nextState,
          },
        },
        tx,
      );
    }

    if (action === "reset_summary") {
      await tx.user.update({
        where: { id: userId },
        data: {
          moderationStrikeCount: 0,
          moderationRiskScore: 0,
          moderationLastIncidentAt: null,
          softBlockedUntil: null,
          moderationState: "CLEAR",
        },
      });

      await tx.userStrikeSnapshot.create({
        data: {
          userId,
          totalStrikes: 0,
          riskScore: 0,
        },
      });

      await createAuditLog(
        {
          actorId: currentUser.id,
          actorRole: currentUser.role,
          actionType: "USER_MODERATION_SUMMARY_RESET",
          targetEntityType: "USER",
          targetEntityId: user.id,
          summary: `Moderator reset moderation summary for user ${user.id}.`,
          metadata: {
            previousStrikeCount: user.moderationStrikeCount,
            previousRiskScore: user.moderationRiskScore,
            previousState: user.moderationState,
          },
        },
        tx,
      );
    }
  });

  revalidatePath("/marketplace/dashboard/moderator/users");
  revalidatePath(`/marketplace/dashboard/moderator/users/${userId}`);

  return {
    message:
      action === "soft_block"
        ? "User soft blocked."
        : action === "clear_soft_block"
          ? "Soft block removed."
          : "Moderation summary reset.",
  };
}
