import { prisma } from "@/lib/prisma";
import { CurrentUserId } from "@/lib/currentUser";

export async function getUserAddresses() {
  const userId = await CurrentUserId();
  if (!userId) return [];

  return prisma.address.findMany({
    where: { userId },
    orderBy: [{ isDefault: "desc" }, { createdAt: "desc" }],
  });
}
