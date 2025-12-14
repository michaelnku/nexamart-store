"use server";

import { prisma } from "@/lib/prisma";
import { registerSchema, registerSchemaType } from "@/lib/zodValidation";
import bcrypt from "bcryptjs";
import { getUserByEmail } from "@/components/helper/data";
import { UserRole } from "@/generated/prisma/client";

/**
 * Create privileged users (RIDER, SELLER, ADMIN, MODERATOR)
 */
export const createRoleUserAction = async (values: registerSchemaType) => {
  try {
    const validatedFields = registerSchema.safeParse(values);
    if (!validatedFields.success) {
      return { error: "Invalid user data" };
    }

    const { name, username, email, password, role } = validatedFields.data;

    const existingUser = await getUserByEmail(email);
    if (existingUser) {
      return { error: "This email already exists. Please login." };
    }

    /**
     * 🔒 HARD ROLE WHITELIST
     * Only these roles can be created from this action
     */
    const allowedRoles: UserRole[] = ["RIDER", "SELLER", "ADMIN", "MODERATOR"];

    if (!allowedRoles.includes(role)) {
      return { error: "Unauthorized role assignment" };
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    await prisma.user.create({
      data: {
        name,
        username,
        email,
        password: hashedPassword,
        role,
      },
    });

    return { success: `${role} account created successfully` };
  } catch (error) {
    console.error("error creating role user", error);
    return { error: "Something went wrong" };
  }
};
