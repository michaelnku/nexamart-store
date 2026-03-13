"use server";

import { UserRole } from "@/generated/prisma/client";
import { createAuditLog } from "@/lib/audit/service";
import { CurrentUser } from "@/lib/currentUser";
import { prisma } from "@/lib/prisma";

export async function verifyStaffProfileAction(
  staffUserId: string,
  verificationMethod = "MANUAL_REVIEW",
) {
  const currentUser = await CurrentUser();
  if (!currentUser?.id) return { error: "Unauthorized" };
  if (currentUser.role !== UserRole.ADMIN) return { error: "Forbidden" };

  if (!staffUserId) return { error: "Staff user id is required" };

  try {
    await prisma.staffProfile.update({
      where: { userId: staffUserId },
      data: {
        isVerified: true,
        verifiedAt: new Date(),
        verificationMethod,
        verificationStatus: "VERIFIED",
      },
    });

    await createAuditLog({
      actorId: currentUser.id,
      actorRole: currentUser.role,
      actionType: "STAFF_VERIFICATION_GRANTED",
      targetEntityType: "STAFF_PROFILE",
      targetEntityId: staffUserId,
      summary: "Granted staff verification.",
      metadata: {
        verificationMethod,
      },
    });

    return { success: true };
  } catch {
    return { error: "Failed to verify staff profile" };
  }
}

export async function clearStaffVerificationAction(staffUserId: string) {
  const currentUser = await CurrentUser();
  if (!currentUser?.id) return { error: "Unauthorized" };
  if (currentUser.role !== UserRole.ADMIN) return { error: "Forbidden" };

  if (!staffUserId) return { error: "Staff user id is required" };

  try {
    await prisma.staffProfile.update({
      where: { userId: staffUserId },
      data: {
        isVerified: false,
        verifiedAt: null,
        verificationMethod: null,
        verificationStatus: "PENDING",
      },
    });

    await createAuditLog({
      actorId: currentUser.id,
      actorRole: currentUser.role,
      actionType: "STAFF_VERIFICATION_CLEARED",
      targetEntityType: "STAFF_PROFILE",
      targetEntityId: staffUserId,
      summary: "Cleared staff verification.",
    });

    return { success: true };
  } catch {
    return { error: "Failed to clear staff verification" };
  }
}
