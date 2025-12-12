"use server";

import { prisma } from "@/lib/prisma";
import { CurrentUserId } from "@/lib/currentUser";
import { revalidatePath } from "next/cache";

export async function saveAddressAction(form: {
  fullName: string;
  phone: string;
  street: string;
  city: string;
  state: string;
  country?: string;
  postalCode?: string;
}) {
  const userId = await CurrentUserId();
  if (!userId) return { error: "Unauthorized" };

  try {
    const safeData = {
      fullName: form.fullName,
      phone: form.phone,
      street: form.street,
      city: form.city,
      state: form.state,
      country: form.country ?? "Nigeria",
      postalCode: form.postalCode ?? "",
      userId,
    };

    const address = await prisma.address.upsert({
      where: { userId },
      update: safeData,
      create: safeData,
    });

    revalidatePath("/checkout");
    return { success: true, address };
  } catch {
    return { error: "Failed to save address" };
  }
}
