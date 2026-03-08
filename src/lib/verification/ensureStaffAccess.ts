import { CurrentUserId } from "@/lib/currentUser";
import { ensureVerifiedStaff } from "@/lib/verification/guards";

export async function ensureStaffAccess() {
  const userId = await CurrentUserId();

  if (!userId) {
    throw new Error("Unauthorized");
  }

  await ensureVerifiedStaff(userId);

  return userId;
}
