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
import { CurrentUser } from "@/lib/currentUser";
import { revalidatePath } from "next/cache";
import { UTApi } from "uploadthing/server";
import { createWelcomeCouponForUser } from "@/lib/coupons/createWelcomeCoupon";
import { createReferralCodeForUser } from "@/lib/referrals/createReferralCode";
import { processReferralSignup } from "@/lib/referrals/processReferralSignup";
import { cookies } from "next/headers";
import { sendEmailVerificationEmail } from "@/lib/email-verification/service";
import { ensureFileAsset } from "@/lib/file-assets";
import { touchOrMarkFileAssetOrphaned } from "@/lib/product-images";
import { userProfileAvatarInclude } from "@/lib/media-views";

const utapi = new UTApi();

export const deleteProfileAvatarAction = async () => {
  const user = await CurrentUser();
  if (!user) return { error: "Unauthorized" };

  try {
    const dbUser = await prisma.user.findUnique({
      where: { id: user.id },
      select: {
        profileAvatarFileAssetId: true,
        profileAvatarFileAsset: {
          select: {
            storageKey: true,
          },
        },
      },
    });

    if (!dbUser?.profileAvatarFileAssetId) {
      return { error: "No profile avatar to delete" };
    }

    const avatarKey = dbUser.profileAvatarFileAsset?.storageKey;

    if (avatarKey) {
      await utapi.deleteFiles([avatarKey]);
    }

    await prisma.$transaction(async (tx) => {
      const previousProfileAvatarFileAssetId = dbUser.profileAvatarFileAssetId;

      await tx.user.update({
        where: { id: user.id },
        data: {
          profileAvatarFileAssetId: null,
        },
      });

      if (previousProfileAvatarFileAssetId) {
        await touchOrMarkFileAssetOrphaned(
          tx,
          previousProfileAvatarFileAssetId,
        );
      }
    });

    return { success: true };
  } catch (err) {
    console.error(err);
    return { error: "Could not delete profile image" };
  }
};

export const createUser = async (values: registerSchemaType) => {
  try {
    const validatedFields = registerSchema.safeParse(values);
    if (!validatedFields.success) {
      return {
        error: "Invalid user data",
      };
    }

    const { email, username, password, referralCode } = validatedFields.data;
    const normalizedEmail = email.toLowerCase().trim();

    const existingUser = await getUserByEmail(normalizedEmail);

    if (existingUser)
      return {
        error: "This email already exist! please login.",
      };

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await prisma.user.create({
      data: {
        username,
        email: normalizedEmail,
        password: hashedPassword,
        emailVerified: null,
      },
    });

    const cookieStore = await cookies();
    const refCodeFromCookie = cookieStore.get("ref_code")?.value;
    const refCode = referralCode?.trim() || refCodeFromCookie;

    await createReferralCodeForUser(user.id);
    await createWelcomeCouponForUser(user.id);
    if (refCode) await processReferralSignup(user.id, refCode);
    try {
      await sendEmailVerificationEmail({
        id: user.id,
        email: user.email,
        name: user.name,
        emailVerified: user.emailVerified,
      });
    } catch (verificationError) {
      console.error(
        "Failed to send signup verification email for user",
        user.id,
        verificationError,
      );
    }

    return {
      success:
        "Account created. Check your email to verify your NexaMart account.",
    };
  } catch (error) {
    console.error("error creating user", error);
    return { error: "Something went wrong while creating your account." };
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

  await prisma.$transaction(async (tx) => {
    const currentUser = await tx.user.findUnique({
      where: { id: user.id },
      include: userProfileAvatarInclude,
    });

    let nextProfileAvatarFileAssetId: string | null | undefined = undefined;
    let previousProfileAvatarFileAssetId: string | null = null;

    if (profileAvatar !== undefined) {
      previousProfileAvatarFileAssetId =
        currentUser?.profileAvatarFileAssetId ?? null;

      if (profileAvatar === null) {
        nextProfileAvatarFileAssetId = null;
      } else {
        const asset = await ensureFileAsset(tx, {
          uploadedById: user.id,
          file: profileAvatar,
          category: "PROFILE_IMAGE",
          kind: "IMAGE",
          isPublic: true,
        });
        nextProfileAvatarFileAssetId = asset.id;
      }
    }

    await tx.user.update({
      where: { id: user.id },
      data: {
        name,
        username,
        profileAvatarFileAssetId: nextProfileAvatarFileAssetId,
      },
    });

    if (
      previousProfileAvatarFileAssetId &&
      previousProfileAvatarFileAssetId !== nextProfileAvatarFileAssetId
    ) {
      await touchOrMarkFileAssetOrphaned(tx, previousProfileAvatarFileAssetId);
    }
  });

  revalidatePath("/profile");

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
