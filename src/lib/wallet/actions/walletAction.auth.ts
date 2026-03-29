import { CurrentUser, CurrentUserId } from "@/lib/currentUser";

export async function requireBuyerUserContext() {
  const userId = await CurrentUserId();
  const user = await CurrentUser();

  if (!userId) throw new Error("Unauthorized");
  if (user?.role !== "USER") throw new Error("Not a buyer");

  return { userId, user } as const;
}

export async function requireSellerUserContext() {
  const userId = await CurrentUserId();
  const user = await CurrentUser();

  if (!userId) throw new Error("Unauthorized");
  if (user?.role !== "SELLER") return { error: "Forbidden" } as const;

  return { userId, user } as const;
}

export async function requireRiderUserContext() {
  const userId = await CurrentUserId();
  const user = await CurrentUser();

  if (!userId) throw new Error("Unauthorized");
  if (user?.role !== "RIDER") return { error: "Forbidden" } as const;

  return { userId, user } as const;
}

