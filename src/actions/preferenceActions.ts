"use server";

import { prisma } from "@/lib/prisma";
import { CurrentUserId } from "@/lib/currentUser";
import { revalidatePath } from "next/cache";
import { PreferencesInput } from "@/lib/types";

export async function updatePreferencesAction(input: PreferencesInput) {
  const userId = await CurrentUserId();
  if (!userId) return { error: "Unauthorized" };

  try {
    await prisma.userPreference.upsert({
      where: { userId },
      create: { userId, ...input },
      update: input,
    });

    revalidatePath("/settings");
    return { success: true };
  } catch {
    return { error: "Failed to update preferences" };
  }
}
