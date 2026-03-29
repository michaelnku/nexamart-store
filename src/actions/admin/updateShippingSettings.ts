"use server";

import { CurrentUser } from "@/lib/currentUser";
import { shippingSettingsFormSchema } from "@/lib/site-config/siteConfig.schema";
import { updateSiteConfiguration } from "@/lib/site-config/siteConfig.service";

export async function updateShippingSettings(
  formData: FormData,
): Promise<{ success: boolean; error?: string }> {
  const currentUser = await CurrentUser();
  if (!currentUser || currentUser.role !== "ADMIN") {
    return {
      success: false,
      error: "You are not authorized to update shipping settings.",
    };
  }

  const parsed = shippingSettingsFormSchema.safeParse({
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

  try {
    await updateSiteConfiguration(parsed.data);

    return { success: true };
  } catch (error) {
    console.error("Failed to update shipping settings", error);

    return {
      success: false,
      error: "We couldn't save your shipping settings right now. Please try again.",
    };
  }
}
