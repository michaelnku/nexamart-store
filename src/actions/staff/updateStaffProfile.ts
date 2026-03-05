"use server";

import { UserRole } from "@/generated/prisma/client";
import { CurrentUser } from "@/lib/currentUser";
import { prisma } from "@/lib/prisma";
import {
  updateStaffProfileSchema,
  type UpdateStaffProfileInput,
} from "@/lib/zodValidation";
import { revalidatePath } from "next/cache";

function normalizePhone(phone?: string): string | null {
  if (!phone) return null;
  const digits = phone.replace(/\D/g, "");
  if (!digits) return null;
  return `+${digits}`;
}

export async function updateStaffProfile(input: UpdateStaffProfileInput) {
  const user = await CurrentUser();
  const userId = user?.id;
  if (!userId) return { error: "Unauthorized" };
  if (user.role !== UserRole.ADMIN && user.role !== UserRole.MODERATOR) {
    return { error: "Only admin and moderator can update staff profile" };
  }

  const parsed = updateStaffProfileSchema.safeParse(input);
  if (!parsed.success) return { error: "Invalid staff profile data" };

  try {
    const existingProfile = await prisma.staffProfile.findUnique({
      where: { userId },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        phone: true,
      },
    });

    if (!existingProfile) {
      return { error: "Staff profile not found" };
    }

    const nextPhone = normalizePhone(parsed.data.phone);
    const identityChanged =
      existingProfile.firstName !== parsed.data.firstName ||
      existingProfile.lastName !== parsed.data.lastName ||
      (existingProfile.phone ?? null) !== nextPhone;

    await prisma.staffProfile.update({
      where: { userId },
      data: {
        firstName: parsed.data.firstName,
        lastName: parsed.data.lastName,
        phone: nextPhone,
        department: parsed.data.department ?? null,
        employmentType: parsed.data.employmentType ?? null,
        ...(identityChanged && {
          isVerified: false,
          verifiedAt: null,
          verificationMethod: null,
          verificationStatus: "INCOMPLETE",
        }),
      },
    });
    revalidatePath("/profile");

    return { success: true };
  } catch {
    return { error: "Failed to update staff profile" };
  }
}
