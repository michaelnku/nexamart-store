import type { RiderProfileDTO } from "@/lib/types";

export type RiderProfileActionError = {
  error: string;
  success?: undefined;
};

export type RiderProfileEmailVerificationError = {
  error: string;
  code: "EMAIL_NOT_VERIFIED";
  requiresEmailVerification: true;
  email?: string;
  success?: undefined;
};

export type RiderProfileActionAuthResult =
  | {
      userId: string;
    }
  | {
      error: "Unauthorized" | "Forbidden";
    };

export type SaveRiderProfileActionResult =
  | {
      success?: RiderProfileDTO;
      error?: string;
      code?: "EMAIL_NOT_VERIFIED";
      requiresEmailVerification?: true;
      email?: string;
    }
  | RiderProfileActionError
  | RiderProfileEmailVerificationError;

export type GetRiderProfileActionResult =
  | {
      success?: RiderProfileDTO;
      error?: string;
    }
  | RiderProfileActionError;

export type ToggleRiderAvailabilityActionResult =
  | {
      success?: boolean;
      error?: string;
    }
  | RiderProfileActionError;

export type UpdateRiderProfileActionResult =
  | {
      success?: boolean;
      error?: string;
      code?: "EMAIL_NOT_VERIFIED";
      requiresEmailVerification?: true;
      email?: string;
    }
  | RiderProfileActionError
  | RiderProfileEmailVerificationError;

export type DeleteRiderProfileActionResult =
  | {
      success?: boolean;
      error?: string;
    }
  | RiderProfileActionError;
