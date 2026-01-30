import { prisma } from "@/lib/prisma";
import { CurrentUserId } from "@/lib/currentUser";

export async function getUserPreferences() {
  const userId = await CurrentUserId();
  if (!userId) return null;

  return prisma.userPreference.findUnique({
    where: { userId },
  });
}
