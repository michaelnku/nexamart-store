"use server";

import { Prisma } from "@/generated/prisma";
import { UserRole } from "@/generated/prisma/client";
import { CurrentUser } from "@/lib/currentUser";
import { prisma } from "@/lib/prisma";
import {
  createStaffProfileSchema,
  type StaffProfileInput,
} from "@/lib/zodValidation";

function normalizePhone(phone?: string): string | null {
  if (!phone) return null;
  const digits = phone.replace(/\D/g, "");
  if (!digits) return null;
  return `+${digits}`;
}

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
        phone: normalizePhone(parsed.data.phone),
        avatar: parsed.data.avatar ?? null,
        department: parsed.data.department ?? null,
        employmentType: parsed.data.employmentType ?? null,
      },
    });

    return { success: true };
  } catch (error: any) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      return { error: "Staff profile already exists" };
    }
    return { error: "Failed to create staff profile" };
  }
}
