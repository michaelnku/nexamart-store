import type { WalletStatus } from "@/generated/prisma/client";

export type ActivateBuyerWalletResult =
  | {
      success: true;
      code: "ACTIVATED" | "ALREADY_ACTIVE";
      walletId: string;
      walletStatus: WalletStatus;
      stripeCustomerId: string;
      createdStripeCustomer: boolean;
      createdWallet: boolean;
    }
  | {
      success: false;
      code:
        | "UNAUTHORIZED"
        | "FORBIDDEN"
        | "ACCOUNT_BLOCKED"
        | "STRIPE_NOT_CONFIGURED"
        | "EMAIL_NOT_VERIFIED";
      message: string;
      requiresEmailVerification?: true;
      email?: string;
    };

