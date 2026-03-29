import { prisma } from "@/lib/prisma";
import { getOrCreateStripeCustomerForUser } from "@/lib/stripe/getOrCreateStripeCustomer";
import { requireVerifiedEmail } from "@/lib/email-verification/guard";
import { isEmailNotVerifiedError } from "@/lib/email-verification/errors";
import { revalidateBuyerWalletPaths } from "./walletAction.revalidate";
import type { ActivateBuyerWalletResult } from "./walletAction.types";

export async function activateBuyerWalletFlow(currentUser: {
  id: string | null | undefined;
}) : Promise<ActivateBuyerWalletResult> {
  if (!currentUser?.id) {
    return {
      success: false,
      code: "UNAUTHORIZED",
      message: "Unauthorized",
    };
  }

  const user = await prisma.user.findUnique({
    where: { id: currentUser.id },
    select: {
      id: true,
      role: true,
      email: true,
      name: true,
      stripeCustomerId: true,
      isBanned: true,
      isDeleted: true,
      deletedAt: true,
    },
  });

  if (!user) {
    return {
      success: false,
      code: "UNAUTHORIZED",
      message: "Unauthorized",
    };
  }

  if (user.role !== "USER") {
    return {
      success: false,
      code: "FORBIDDEN",
      message: "Only buyers can activate a wallet.",
    };
  }

  if (user.isBanned || user.isDeleted || user.deletedAt) {
    return {
      success: false,
      code: "ACCOUNT_BLOCKED",
      message: "This account cannot activate a wallet right now.",
    };
  }

  if (!process.env.STRIPE_SECRET_KEY) {
    return {
      success: false,
      code: "STRIPE_NOT_CONFIGURED",
      message: "Stripe is not configured.",
    };
  }

  try {
    await requireVerifiedEmail({
      userId: user.id,
      reason: "wallet_activation",
    });
  } catch (error) {
    if (isEmailNotVerifiedError(error)) {
      return {
        success: false,
        code: "EMAIL_NOT_VERIFIED",
        message: "Verify your email before activating your wallet.",
        requiresEmailVerification: true,
        email: error.email,
      };
    }

    throw error;
  }

  const existingWallet = await prisma.wallet.findUnique({
    where: { userId: user.id },
    select: {
      id: true,
      status: true,
    },
  });

  const wallet =
    existingWallet ??
    (await prisma.wallet.create({
      data: {
        userId: user.id,
        status: "INACTIVE",
      },
      select: {
        id: true,
        status: true,
      },
    }));

  const stripeCustomer = await getOrCreateStripeCustomerForUser(user.id, {
    user,
  });

  if (wallet.status === "ACTIVE") {
    revalidateBuyerWalletPaths();

    return {
      success: true,
      code: "ALREADY_ACTIVE",
      walletId: wallet.id,
      walletStatus: "ACTIVE",
      stripeCustomerId: stripeCustomer.stripeCustomerId,
      createdStripeCustomer: stripeCustomer.created,
      createdWallet: !existingWallet,
    };
  }

  await prisma.wallet.update({
    where: { id: wallet.id },
    data: {
      status: "ACTIVE",
    },
  });

  revalidateBuyerWalletPaths();

  return {
    success: true,
    code: "ACTIVATED",
    walletId: wallet.id,
    walletStatus: "ACTIVE",
    stripeCustomerId: stripeCustomer.stripeCustomerId,
    createdStripeCustomer: stripeCustomer.created,
    createdWallet: !existingWallet,
  };
}

