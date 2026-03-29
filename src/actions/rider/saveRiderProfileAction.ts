"use server";

import {
  type riderProfileSchemaType,
} from "@/lib/zodValidation";
import { requireRiderProfileUserId } from "@/lib/rider/profile-actions/riderProfileAction.auth";
import { parseRiderProfileInput, requireVerifiedEmailForRiderProfile } from "@/lib/rider/profile-actions/riderProfileAction.validation";
import { saveRiderProfileFlow } from "@/lib/rider/profile-actions/saveRiderProfileFlow";
import { loadRiderProfileView } from "@/lib/rider/profile-actions/loadRiderProfileView";
import { toggleRiderAvailabilityFlow } from "@/lib/rider/profile-actions/toggleRiderAvailabilityFlow";
import { updateRiderProfileFlow } from "@/lib/rider/profile-actions/updateRiderProfileFlow";
import { deleteRiderProfileFlow } from "@/lib/rider/profile-actions/deleteRiderProfileFlow";
import type {
  DeleteRiderProfileActionResult,
  GetRiderProfileActionResult,
  SaveRiderProfileActionResult,
  ToggleRiderAvailabilityActionResult,
  UpdateRiderProfileActionResult,
} from "@/lib/rider/profile-actions/riderProfileAction.types";

export async function saveRiderProfileAction(
  rawData: riderProfileSchemaType,
): Promise<SaveRiderProfileActionResult> {
  const auth = await requireRiderProfileUserId();
  if ("error" in auth) return auth;

  const verificationError = await requireVerifiedEmailForRiderProfile(
    auth.userId,
    "save",
  );
  if (verificationError) return verificationError;

  const parsed = parseRiderProfileInput(rawData);

  if (!parsed.success) {
    return {
      error: parsed.error.message ?? "Invalid input",
    };
  }

  try {
    const profile = await saveRiderProfileFlow({
      userId: auth.userId,
      data: parsed.data,
    });

    return {
      success: profile,
    };
  } catch (error: unknown) {
    if (
      error instanceof Error &&
      error.message === "Plate number is already registered"
    ) {
      return { error: error.message };
    }

    console.error("Rider profile save error:", error);
    return { error: "Failed to save rider profile" };
  }
}

export async function getRiderProfileAction(): Promise<GetRiderProfileActionResult> {
  const auth = await requireRiderProfileUserId();
  if ("error" in auth) return auth;

  return loadRiderProfileView(auth.userId);
}

export async function toggleRiderAvailabilityAction(
  goOnline: boolean,
): Promise<ToggleRiderAvailabilityActionResult> {
  const auth = await requireRiderProfileUserId();
  if ("error" in auth) return auth;

  return toggleRiderAvailabilityFlow({
    userId: auth.userId,
    goOnline,
  });
}

export async function updateRiderProfileAction(
  rawData: riderProfileSchemaType,
): Promise<UpdateRiderProfileActionResult> {
  const auth = await requireRiderProfileUserId();
  if ("error" in auth) return auth;

  const verificationError = await requireVerifiedEmailForRiderProfile(
    auth.userId,
    "update",
  );
  if (verificationError) return verificationError;

  const parsed = parseRiderProfileInput(rawData);

  if (!parsed.success) {
    return { error: parsed.error.message };
  }

  try {
    await updateRiderProfileFlow({
      userId: auth.userId,
      data: parsed.data,
    });

    return { success: true };
  } catch (error: unknown) {
    if (error instanceof Error) {
      return { error: error.message || "Update failed" };
    }
    return { error: "Update failed" };
  }
}

export async function deleteRiderProfileAction(): Promise<DeleteRiderProfileActionResult> {
  const auth = await requireRiderProfileUserId();
  if ("error" in auth) return auth;

  return deleteRiderProfileFlow(auth.userId);
}
