import { UserRole, VerificationRole } from "@/generated/prisma";

export function mapUserRoleToVerificationRole(
  role: UserRole,
): VerificationRole | null {
  switch (role) {
    case "SELLER":
      return "SELLER";

    case "RIDER":
      return "RIDER";

    case "ADMIN":
    case "MODERATOR":
      return "STAFF";

    default:
      return null;
  }
}
