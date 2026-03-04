import { CurrentUser } from "@/lib/currentUser";
import { prisma } from "@/lib/prisma";

export async function getCurrentSellerStore() {
  const user = await CurrentUser();
  if (!user || user.role !== "SELLER") return null;

  return prisma.store.findUnique({
    where: { userId: user.id },
  });
}
