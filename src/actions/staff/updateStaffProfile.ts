"use server";

import { CurrentUserId } from "@/lib/currentUser";
import { prisma } from "@/lib/prisma";
import {
  updateStaffProfileSchema,
  type UpdateStaffProfileInput,
} from "@/lib/zodValidation";

export async function updateStaffProfile(input: UpdateStaffProfileInput) {
  const userId = await CurrentUserId();
  if (!userId) return { error: "Unauthorized" };

  const parsed = updateStaffProfileSchema.safeParse(input);
  if (!parsed.success) return { error: "Invalid staff profile data" };

  try {
    const existingProfile = await prisma.staffProfile.findUnique({
      where: { userId },
      select: { id: true },
    });

    if (!existingProfile) {
      return { error: "Staff profile not found" };
    }

    const duplicateStaffId = await prisma.staffProfile.findFirst({
      where: {
        staffId: parsed.data.staffId,
        userId: { not: userId },
      },
      select: { id: true },
    });

    if (duplicateStaffId) {
      return { error: "Staff ID already exists" };
    }

    await prisma.staffProfile.update({
      where: { userId },
      data: {
        staffId: parsed.data.staffId,
        firstName: parsed.data.firstName,
        lastName: parsed.data.lastName,
        phone: parsed.data.phone ?? null,
        avatar: parsed.data.avatar ?? null,
        department: parsed.data.department ?? null,
        employmentType: parsed.data.employmentType ?? null,
        status: parsed.data.status ?? undefined,
      },
    });

    return { success: true };
  } catch {
    return { error: "Failed to update staff profile" };
  }
}
