"use server";

import { CurrentUserId } from "@/lib/currentUser";
import { cleanProductBackground } from "@/lib/ai/cleanProductBackground";
import { rateLimit } from "@/lib/security/rateLimit";

type CleanProductBackgroundActionInput = {
  dataUrl: string;
  fileName?: string;
  mimeType?: string;
};

export async function cleanProductBackgroundAction(
  input: CleanProductBackgroundActionInput,
) {
  const userId = await CurrentUserId();

  if (!userId) {
    return { error: "Unauthorized" };
  }

  const allowed = rateLimit(`clean-product-background-${userId}`, 8, 60_000);

  if (!allowed) {
    return {
      error: "Too many enhancement attempts. Please wait a moment and try again.",
    };
  }

  if (!input.dataUrl) {
    return { error: "Missing image payload." };
  }

  try {
    const result = await cleanProductBackground(input);
    return { success: true, ...result };
  } catch (error) {
    console.error("Product background enhancement failed:", error);
    return {
      error: "Background enhancement failed. Please try again.",
    };
  }
}
