"use server";

import { prisma } from "@/lib/prisma";
import {
  loggedInUserSchema,
  loggedInUserSchemaType,
  registerSchemaType,
  registerSchema,
  changePasswordSchema,
  ChangePasswordSchemaType,
  updateUserSchema,
  updateUserSchemaType,
} from "@/lib/zodValidation";
import bcrypt from "bcryptjs";
import { getUserByEmail } from "@/components/helper/data";
import { signIn } from "@/auth/auth";
import { AuthError } from "next-auth";
import { DEFAULT_LOGIN_REDIRECT } from "@/routes";
import { Prisma } from "@/generated/prisma";
import { CurrentUser } from "@/lib/currentUser";
import { revalidatePath } from "next/cache";

export const createUser = async (values: registerSchemaType) => {
  try {
    const validatedFields = registerSchema.safeParse(values);
    if (!validatedFields.success) {
      return {
        error: "Invalid user data",
      };
    }

    const { email, username, password } = validatedFields.data;

    const existingUser = await getUserByEmail(email);

    if (existingUser)
      return {
        error: "This email already exist! please login.",
      };

    const hashedPassword = await bcrypt.hash(password, 10);

    await prisma.user.create({
      data: {
        username,
        email,
        password: hashedPassword,
      },
    });

    return { success: "New user created!" };
  } catch (error) {
    console.error("error creating user", error);
  }
};

export const loggedInUser = async (values: loggedInUserSchemaType) => {
  const validatedFields = loggedInUserSchema.safeParse(values);

  if (!validatedFields.success) {
    return {
      error: "Invalid user data",
    };
  }

  const { email, password } = validatedFields.data;

  const existingUser = await getUserByEmail(email);

  if (!existingUser || !existingUser.password)
    return {
      error: "Invalid credentials",
    };

  try {
    await signIn("credentials", {
      email,
      password,
      redirectTo: DEFAULT_LOGIN_REDIRECT,
    });
  } catch (error) {
    if (error instanceof AuthError) {
      switch (error.type) {
        case "CredentialsSignin":
          return { error: "Invalid email or password" };
        default:
          return {
            error: "An unknown error occured during sign-in, please try again!",
          };
      }
    }
  }

  //if all checks proceed with user login
};

//update user profile action
export async function updateUserProfile(values: updateUserSchemaType) {
  const parsed = updateUserSchema.safeParse(values);
  if (!parsed.success) {
    return { error: "Invalid profile data" };
  }

  const { name, username, profileAvatar } = parsed.data;

  const user = await CurrentUser();
  if (!user) return { error: "Unauthorized" };

  if (username) {
    const existing = await prisma.user.findFirst({
      where: {
        username,
        NOT: { id: user.id },
      },
    });

    if (existing) {
      return { error: "Username already taken" };
    }
  }

  await prisma.user.update({
    where: { id: user.id },
    data: {
      name,
      username,
      profileAvatar:
        profileAvatar === undefined
          ? undefined
          : profileAvatar === null
          ? Prisma.JsonNull
          : profileAvatar,
    },
  });

  revalidatePath("/dashboard/profile");

  return { success: true };
}

//password change action
export async function changePassword(values: ChangePasswordSchemaType) {
  const parsed = changePasswordSchema.safeParse(values);
  if (!parsed.success) {
    return { error: "Invalid password data" };
  }

  const { currentPassword, newPassword } = parsed.data;

  const user = await CurrentUser();
  if (!user) return { error: "Unauthorized" };

  const dbUser = await prisma.user.findUnique({
    where: { id: user.id },
    select: { password: true },
  });

  if (!dbUser?.password) {
    return {
      error: "Password change not available for this account",
    };
  }

  const isValid = await bcrypt.compare(currentPassword, dbUser.password);

  if (!isValid) {
    return { error: "Current password is incorrect" };
  }

  const hashed = await bcrypt.hash(newPassword, 12);

  await prisma.user.update({
    where: { id: user.id },
    data: {
      password: hashed,
    },
  });

  return { success: true };
}
