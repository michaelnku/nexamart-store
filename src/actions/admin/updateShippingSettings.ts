"use server";

import { CurrentRole } from "@/lib/currentUser";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { updateSiteConfigurationFields } from "./siteConfig";

const numericField = z
  .string()
  .trim()
  .transform((value) => Number(value))
  .refine((value) => Number.isFinite(value), { message: "Invalid number" });

const shippingSettingsSchema = z.object({
  foodMinimumDeliveryFee: numericField,
  generalMinimumDeliveryFee: numericField,
  foodBaseDeliveryRate: numericField,
  foodRatePerMile: numericField,
  generalBaseDeliveryRate: numericField,
  generalRatePerMile: numericField,
  expressMultiplier: numericField,
  pickupFee: numericField,
});

type ShippingSettingsResult = { success: true } | { success: false; error: string };

export async function updateShippingSettings(
  formData: FormData,
): Promise<ShippingSettingsResult> {
  const role = await CurrentRole();
  if (role !== "ADMIN") {
    return { success: false, error: "Unauthorized" };
  }

  const parsed = shippingSettingsSchema.safeParse({
    foodMinimumDeliveryFee: formData.get("foodMinimumDeliveryFee")?.toString(),
    generalMinimumDeliveryFee: formData
      .get("generalMinimumDeliveryFee")
      ?.toString(),
    foodBaseDeliveryRate: formData.get("foodBaseDeliveryRate")?.toString(),
    foodRatePerMile: formData.get("foodRatePerMile")?.toString(),
    generalBaseDeliveryRate: formData
      .get("generalBaseDeliveryRate")
      ?.toString(),
    generalRatePerMile: formData.get("generalRatePerMile")?.toString(),
    expressMultiplier: formData.get("expressMultiplier")?.toString(),
    pickupFee: formData.get("pickupFee")?.toString(),
  });

  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.issues[0]?.message ?? "Invalid shipping settings",
    };
  }

  await updateSiteConfigurationFields(parsed.data);

  revalidatePath("/marketplace/dashboard/settings");
  revalidatePath("/marketplace/dashboard/settings/shipping");
  revalidatePath("/marketplace/dashboard/settings/site");
  revalidatePath("/");

  return { success: true };
}
