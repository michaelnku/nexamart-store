export type VerificationStatus =
  | "PENDING"
  | "IN_REVIEW"
  | "VERIFIED"
  | "REJECTED";

export type VerificationUpdatedEvent = {
  status: VerificationStatus;
};
