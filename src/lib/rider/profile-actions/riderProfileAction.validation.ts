import { isEmailNotVerifiedError } from "@/lib/email-verification/errors";
import { requireVerifiedEmail } from "@/lib/email-verification/guard";
import {
  riderProfileSchema,
  type riderProfileSchemaType,
} from "@/lib/zodValidation";
import type {
  RiderProfileEmailVerificationError,
} from "./riderProfileAction.types";

export function parseRiderProfileInput(rawData: riderProfileSchemaType) {
  return riderProfileSchema.safeParse(rawData);
}

export async function requireVerifiedEmailForRiderProfile(
  userId: string,
  mode: "save" | "update",
): Promise<RiderProfileEmailVerificationError | null> {
  try {
    await requireVerifiedEmail({
      userId,
      reason: "rider_profile_setup",
    });

    return null;
  } catch (error) {
    if (isEmailNotVerifiedError(error)) {
      return {
        error:
          mode === "save"
            ? "Verify your email before setting up your rider profile."
            : "Verify your email before updating your rider profile.",
        code: "EMAIL_NOT_VERIFIED",
        requiresEmailVerification: true,
        email: error.email,
      };
    }

    throw error;
  }
}
