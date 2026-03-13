"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import {
  ADMIN_ASSIGNABLE_USER_ROLES,
  USER_ROLE_LABELS,
  isProtectedAdminRole,
} from "@/lib/admin/user-management.shared";
import { CurrentUser } from "@/lib/currentUser";
import { prisma } from "@/lib/prisma";

const updateUserRoleSchema = z.object({
  userId: z.string().cuid(),
  role: z.enum(ADMIN_ASSIGNABLE_USER_ROLES),
});

const ADMIN_USERS_REVALIDATE_PATHS = [
  "/marketplace/dashboard/admin/users",
  "/marketplace/dashboard/admin/sellers",
  "/marketplace/dashboard/admin/riders",
  "/marketplace/dashboard/admin/moderators",
] as const;

export async function updateAdminManagedUserRole(input: {
  userId: string;
  role: (typeof ADMIN_ASSIGNABLE_USER_ROLES)[number];
}) {
  const validated = updateUserRoleSchema.safeParse(input);

  if (!validated.success) {
    return { error: "Invalid role update request." };
  }

  const currentUser = await CurrentUser();

  if (!currentUser || currentUser.role !== "ADMIN") {
    return { error: "Only admins can update user roles." };
  }

  const { userId, role } = validated.data;

  if (currentUser.id === userId) {
    return { error: "Admins cannot demote or otherwise change their own role." };
  }

  try {
    const targetUser = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        role: true,
        deletedAt: true,
        isDeleted: true,
      },
    });

    if (!targetUser || targetUser.deletedAt || targetUser.isDeleted) {
      return { error: "User not found." };
    }

    if (isProtectedAdminRole(targetUser.role)) {
      return { error: "Protected accounts cannot be changed from this panel." };
    }

    if (targetUser.role === role) {
      return {
        success: `${USER_ROLE_LABELS[targetUser.role]} access is already assigned.`,
      };
    }

    await prisma.user.update({
      where: { id: targetUser.id },
      data: {
        role,
      },
    });

    for (const path of ADMIN_USERS_REVALIDATE_PATHS) {
      revalidatePath(path);
    }

    return {
      success: `Role updated to ${USER_ROLE_LABELS[role]}.`,
    };
  } catch (error) {
    console.error("updateAdminManagedUserRole failed", error);
    return { error: "Unable to update this user role right now." };
  }
}
