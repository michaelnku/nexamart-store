"use server";

import { revalidatePath } from "next/cache";
import { createAuditLog } from "@/lib/audit/service";
import { UserReportStatus } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import { requireModerator } from "@/lib/moderation/guardModerator";

type ReviewUserReportAction = "under_review" | "resolved" | "rejected";

const USER_REPORT_ACTION_MESSAGES: Record<ReviewUserReportAction, string> = {
  under_review: "Report moved to under review.",
  resolved: "Report resolved successfully.",
  rejected: "Report rejected successfully.",
};

function canTransitionReport(
  currentStatus: UserReportStatus,
  nextStatus: UserReportStatus,
) {
  if (currentStatus === nextStatus) return false;
  if (currentStatus === "RESOLVED" || currentStatus === "REJECTED") return false;
  return true;
}

export async function reviewUserReportAction(
  reportId: string,
  action: ReviewUserReportAction,
) {
  const currentUser = await requireModerator();

  const nextStatus =
    action === "under_review"
      ? "UNDER_REVIEW"
      : action === "resolved"
        ? "RESOLVED"
        : "REJECTED";

  await prisma.$transaction(async (tx) => {
    const report = await tx.userReport.findUnique({
      where: { id: reportId },
      select: {
        id: true,
        status: true,
        reason: true,
        targetType: true,
        targetId: true,
        moderationIncidentId: true,
      },
    });

    if (!report) {
      throw new Error("Report not found.");
    }

    if (!canTransitionReport(report.status, nextStatus)) {
      throw new Error("This report can no longer be updated from its current status.");
    }

    const updateResult = await tx.userReport.updateMany({
      where: {
        id: reportId,
        status: report.status,
      },
      data: {
        status: nextStatus,
        reviewedById: currentUser.id,
        reviewedAt: new Date(),
      },
    });

    if (updateResult.count !== 1) {
      throw new Error("Report state changed. Refresh and try again.");
    }

    await createAuditLog(
      {
        actorId: currentUser.id,
        actorRole: currentUser.role,
        actionType:
          action === "under_review"
            ? "USER_REPORT_MARKED_UNDER_REVIEW"
            : action === "resolved"
              ? "USER_REPORT_RESOLVED"
              : "USER_REPORT_REJECTED",
        targetEntityType: "USER_REPORT",
        targetEntityId: report.id,
        summary: `Moderator updated report ${report.id} to ${nextStatus}.`,
        metadata: {
          reason: report.reason,
          targetType: report.targetType,
          targetId: report.targetId,
          linkedIncidentId: report.moderationIncidentId,
          previousStatus: report.status,
          nextStatus,
        },
      },
      tx,
    );
  });

  revalidatePath("/marketplace/dashboard/moderator/reports");
  revalidatePath(`/marketplace/dashboard/moderator/reports/${reportId}`);

  return {
    message: USER_REPORT_ACTION_MESSAGES[action],
  };
}
