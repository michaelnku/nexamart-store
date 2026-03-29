import { CurrentRole, CurrentUserId } from "@/lib/currentUser";
import type { RiderProfileActionAuthResult } from "./riderProfileAction.types";

export async function requireRiderProfileUserId(): Promise<RiderProfileActionAuthResult> {
  const userId = await CurrentUserId();
  const role = await CurrentRole();

  if (!userId) return { error: "Unauthorized" };
  if (role !== "RIDER") return { error: "Forbidden" };

  return { userId };
}
