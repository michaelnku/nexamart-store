import { CurrentRole, CurrentUserId } from "@/lib/currentUser";

export async function resolveSellerOrderActionAuth() {
  const userId = await CurrentUserId();
  if (!userId) {
    return { error: true } as const;
  }

  const role = await CurrentRole();
  if (role !== "SELLER") {
    return { error: true } as const;
  }

  return { userId } as const;
}

