"use server";

import { CurrentUserId } from "@/lib/currentUser";
import { prisma } from "@/lib/prisma";

export async function getStaffProfile() {
  const userId = await CurrentUserId();
  if (!userId) return { error: "Unauthorized" };

  try {
    const profile = await prisma.staffProfile.findUnique({
      where: { userId },
    });

    return { success: true, profile };
  } catch {
    return { error: "Failed to fetch staff profile" };
  }
}
