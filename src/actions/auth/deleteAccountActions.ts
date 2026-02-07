"use server";

import { prisma } from "@/lib/prisma";
import { CurrentUser } from "@/lib/currentUser";
import { revalidatePath } from "next/cache";
import { signOut } from "@/auth/auth";

export async function deleteUserAccount(userId: string) {
  const user = await CurrentUser();
  if (!user) return { error: "Unauthorized" };

  try {
    const now = new Date();
    const scheduled = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

    await prisma.user.update({
      where: { id: userId },
      data: {
        isDeleted: true,
        deletedAt: now,
        scheduledDeletionAt: scheduled,
      },
    });

    await signOut({ redirect: false });

    revalidatePath("/");
    revalidatePath("/dashboard");

    return { success: true, scheduledDeletionAt: scheduled };
  } catch (error) {
    console.error("Delete account error:", error);
    return { error: "Failed to delete account" };
  }
}

export async function restoreUserAccount(userId: string) {
  const user = await CurrentUser();
  if (!user) return { error: "Unauthorized" };
  if (user.id !== userId) return { error: "Unauthorized" };

  const db = await prisma.user.findUnique({
    where: { id: userId },
    select: { scheduledDeletionAt: true, isDeleted: true },
  });

  if (!db?.isDeleted) return { error: "Account is not scheduled for deletion" };

  if (db.scheduledDeletionAt && db.scheduledDeletionAt < new Date()) {
    return { error: "Deletion window has passed" };
  }

  await prisma.user.update({
    where: { id: userId },
    data: {
      isDeleted: false,
      deletedAt: null,
      scheduledDeletionAt: null,
    },
  });

  revalidatePath("/");
  revalidatePath("/dashboard");

  return { success: true };
}

export async function purgeDeletedUsers() {
  const now = new Date();

  const users = await prisma.user.findMany({
    where: {
      isDeleted: true,
      scheduledDeletionAt: { lte: now },
    },
    select: { id: true },
  });

  for (const u of users) {
    await prisma.user.delete({ where: { id: u.id } });
  }

  return { success: true, purged: users.length };
}
