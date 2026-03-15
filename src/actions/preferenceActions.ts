"use server";

import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import { CurrentUserId } from "@/lib/currentUser";
import { revalidatePath } from "next/cache";
import {
  CURRENCY_COOKIE_NAME,
  isSupportedCurrency,
} from "@/lib/currency/currencyConfig";
import { PreferencesInput } from "@/lib/types";

export async function updatePreferencesAction(input: PreferencesInput) {
  const userId = await CurrentUserId();
  if (!userId) return { error: "Unauthorized" };

  try {
    const normalizedInput = {
      ...input,
      currency: isSupportedCurrency(input.currency) ? input.currency : undefined,
    };

    await prisma.userPreference.upsert({
      where: { userId },
      create: { userId, ...normalizedInput },
      update: normalizedInput,
    });

    if (normalizedInput.currency) {
      const cookieStore = await cookies();
      cookieStore.set(CURRENCY_COOKIE_NAME, normalizedInput.currency, {
        path: "/",
        maxAge: 31536000,
        sameSite: "lax",
      });
    }

    revalidatePath("/settings");
    return { success: true };
  } catch {
    return { error: "Failed to update preferences" };
  }
}
