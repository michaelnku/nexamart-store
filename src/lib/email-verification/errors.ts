import { EMAIL_NOT_VERIFIED_CODE } from "@/lib/email-verification/constants";

export class EmailNotVerifiedError extends Error {
  readonly code = EMAIL_NOT_VERIFIED_CODE;
  readonly userId: string;
  readonly email: string;
  readonly reason: string;
  readonly canResend = true;

  constructor(params: { userId: string; email: string; reason: string }) {
    super("Verify your email to continue.");
    this.name = "EmailNotVerifiedError";
    this.userId = params.userId;
    this.email = params.email;
    this.reason = params.reason;
  }
}

export function isEmailNotVerifiedError(
  error: unknown,
): error is EmailNotVerifiedError {
  return error instanceof EmailNotVerifiedError;
}
