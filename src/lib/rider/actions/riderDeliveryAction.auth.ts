import { CurrentRole, CurrentUserId } from "@/lib/currentUser";
import { ensureVerifiedRider } from "@/lib/verification/guards";
import type { RiderDeliveryAuthResult } from "./riderDeliveryAction.types";

export async function requireAdminUserId(): Promise<RiderDeliveryAuthResult> {
  const userId = await CurrentUserId();
  if (!userId) return { error: "Unauthorized" };

  const role = await CurrentRole();
  if (role !== "ADMIN") return { error: "Forbidden" };

  return { userId };
}

export async function requireRiderUserId(): Promise<RiderDeliveryAuthResult> {
  const userId = await CurrentUserId();
  if (!userId) return { error: "Unauthorized" };

  const role = await CurrentRole();
  if (role !== "RIDER") return { error: "Forbidden" };

  return { userId };
}

export async function requireVerifiedRiderUserId(): Promise<RiderDeliveryAuthResult> {
  const userId = await CurrentUserId();
  if (!userId) return { error: "Unauthorized" };

  await ensureVerifiedRider(userId);

  const role = await CurrentRole();
  if (role !== "RIDER") return { error: "Forbidden" };

  return { userId };
}
