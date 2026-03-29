"use server";

import { CurrentUser } from "@/lib/currentUser";
import { shippingSettingsFormSchema } from "@/lib/site-config/siteConfig.schema";
import { updateSiteConfiguration } from "@/lib/site-config/siteConfig.service";

export async function updateShippingSettings(
  formData: FormData,
): Promise<void> {
  const currentUser = await CurrentUser();
  if (!currentUser || currentUser.role !== "ADMIN") {
    throw new Error("Unauthorized");
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
    throw new Error(
      parsed.error.issues[0]?.message ?? "Invalid shipping settings",
    );
  }

  await updateSiteConfiguration(parsed.data);
}
