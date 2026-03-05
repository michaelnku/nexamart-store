"use server";

import { UserRole } from "@/generated/prisma/client";
import { CurrentUser } from "@/lib/currentUser";
import { prisma } from "@/lib/prisma";

export async function getStaffProfile() {
  const user = await CurrentUser();
  const userId = user?.id;
  if (!userId) return { error: "Unauthorized" };
  if (user.role !== UserRole.ADMIN && user.role !== UserRole.MODERATOR) {
    return { error: "Only admin and moderator can access staff profile" };
  }

  try {
    const profile = await prisma.staffProfile.findUnique({
      where: { userId },
    });

    return { success: true, profile };
  } catch {
    return { error: "Failed to fetch staff profile" };
  }
}
