"use server";

import {
  deleteRiderProfileAction,
  getRiderProfileAction,
  saveRiderProfileAction,
  toggleRiderAvailabilityAction,
  updateRiderProfileAction,
} from "@/actions/rider/saveRiderProfileAction";
import { revalidatePath } from "next/cache";

export async function saveRiderProfileModule(formData: FormData) {
  const payload = {
    vehicleType: formData.get("vehicleType")?.toString().trim() || "",
    plateNumber: formData.get("plateNumber")?.toString().trim() || "",
    licenseNumber: formData.get("licenseNumber")?.toString().trim() || "",
    vehicleColor: formData.get("vehicleColor")?.toString().trim() || "",
    vehicleModel: formData.get("vehicleModel")?.toString().trim() || "",
    isAvailable: false,
  };

  const existing = await getRiderProfileAction();
  const result = existing.success
    ? await updateRiderProfileAction(payload)
    : await saveRiderProfileAction(payload);

  if (result?.error) {
    throw new Error(result.error);
  }

  revalidatePath("/settings/rider");
  revalidatePath("/settings/rider/profile");
}

export async function updateRiderOperationsModule(formData: FormData) {
  const goOnline = formData.get("isAvailable") === "on";
  const result = await toggleRiderAvailabilityAction(goOnline);
  if (result?.error) {
    throw new Error(result.error);
  }

  revalidatePath("/settings/rider");
  revalidatePath("/settings/rider/operations");
}

export async function deleteRiderProfileModule(formData: FormData) {
  const confirmation = formData.get("confirmation")?.toString().trim();
  if (confirmation !== "CLEAR PROFILE") {
    throw new Error('Type "CLEAR PROFILE" to continue.');
  }

  const result = await deleteRiderProfileAction();
  if (result?.error) {
    throw new Error(result.error);
  }

  revalidatePath("/settings/rider");
  revalidatePath("/settings/rider/profile");
  revalidatePath("/settings/rider/operations");
}
