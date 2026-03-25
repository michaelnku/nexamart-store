"use server";

import { UserRole } from "@/generated/prisma/client";
import { CurrentUser } from "@/lib/currentUser";
import { prisma } from "@/lib/prisma";
import {
  createStaffProfileSchema,
  type StaffProfileInput,
} from "@/lib/zodValidation";
import { revalidatePath } from "next/cache";
import { requireVerifiedEmail } from "@/lib/email-verification/guard";
import { isEmailNotVerifiedError } from "@/lib/email-verification/errors";
import { normalizeOptionalPhoneToE164 } from "@/lib/otp/phone";

function staffPrefixForRole(role: UserRole): "ADM" | "MDR" | null {
  if (role === "ADMIN") return "ADM";
  if (role === "MODERATOR") return "MDR";
  return null;
}

async function generateUniqueStaffId(prefix: "ADM" | "MDR") {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  for (let attempt = 0; attempt < 10; attempt += 1) {
    let suffix = "";
    for (let i = 0; i < 6; i += 1) {
      suffix += chars[Math.floor(Math.random() * chars.length)];
    }
    const staffId = `STF-${prefix}-${suffix}`;
    const exists = await prisma.staffProfile.findUnique({
      where: { staffId },
      select: { id: true },
    });
    if (!exists) return staffId;
  }
  throw new Error("Failed to generate unique staff ID");
}

export async function createStaffProfile(
  userId: string,
  input: StaffProfileInput,
) {
  const sessionUser = await CurrentUser();
  if (!sessionUser?.id) return { error: "Unauthorized" };
  if (!userId || sessionUser.id !== userId) return { error: "Unauthorized" };

  const prefix = staffPrefixForRole(sessionUser.role as UserRole);
  if (!prefix) {
    return { error: "Only admin and moderator can create staff profile" };
  }

  try {
    await requireVerifiedEmail({
      userId,
      reason: "staff_profile_setup",
    });
  } catch (error) {
    if (isEmailNotVerifiedError(error)) {
      return {
        error: "Verify your email before creating your staff profile.",
        code: "EMAIL_NOT_VERIFIED",
        requiresEmailVerification: true,
        email: error.email,
      };
    }

    throw error;
  }

  const parsed = createStaffProfileSchema.safeParse(input);
  if (!parsed.success) return { error: "Invalid staff profile data" };

  try {
    const existingByUser = await prisma.staffProfile.findUnique({
      where: { userId },
      select: { id: true },
    });

    if (existingByUser) {
      return { error: "Staff profile already exists for this user" };
    }

    const staffId = await generateUniqueStaffId(prefix);

    await prisma.staffProfile.create({
      data: {
        userId,
        staffId,
        firstName: parsed.data.firstName,
        lastName: parsed.data.lastName,
        phone: normalizeOptionalPhoneToE164(parsed.data.phone),
        department: parsed.data.department ?? null,
        employmentType: parsed.data.employmentType ?? null,
        isVerified: false,
        verifiedAt: null,
        verificationMethod: null,
        verificationStatus: "PENDING",
      },
    });

    revalidatePath("/profile");

    return { success: true };
  } catch {
    return { error: "Failed to create staff profile" };
  }
}
