"use server";

import { prisma } from "@/lib/prisma";
import { CurrentUser } from "@/lib/currentUser";

export async function clearUserCartAction() {
  const user = await CurrentUser();
  if (!user) return { error: "Not authenticated" };

  await prisma.cartItem.deleteMany({
    where: { cart: { userId: user.id } },
  });

  return { success: true };
}
