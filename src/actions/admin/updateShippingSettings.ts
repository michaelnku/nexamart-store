"use server";

import { createAuditLog } from "@/lib/audit/service";
import { CurrentUser } from "@/lib/currentUser";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { updateSiteConfigurationFields } from "./siteConfig";

const numericField = z
  .string()
  .trim()
  .transform((value) => Number(value))
  .refine((value) => Number.isFinite(value), { message: "Invalid number" })
  .refine((value) => value >= 0, {
    message: "Value must be greater than or equal to 0",
  });

const shippingSettingsSchema = z.object({
  foodMinimumDeliveryFee: numericField,
  generalMinimumDeliveryFee: numericField,
  foodBaseDeliveryRate: numericField,
  foodRatePerMile: numericField,
  generalBaseDeliveryRate: numericField,
  generalRatePerMile: numericField,
  expressMultiplier: numericField.refine((value) => value >= 1, {
    message: "Express multiplier must be at least 1",
  }),
  pickupFee: numericField,
});

export async function updateShippingSettings(
  formData: FormData,
): Promise<void> {
  const currentUser = await CurrentUser();
  if (!currentUser || currentUser.role !== "ADMIN") {
    throw new Error("Unauthorized");
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
    throw new Error(
      parsed.error.issues[0]?.message ?? "Invalid shipping settings",
    );
  }

  await updateSiteConfigurationFields(parsed.data);

  await createAuditLog({
    actorId: currentUser.id,
    actorRole: currentUser.role,
    actionType: "SHIPPING_SETTINGS_UPDATED",
    targetEntityType: "SITE_CONFIGURATION",
    summary: "Updated shipping settings.",
    metadata: {
      updatedFields: Object.keys(parsed.data),
    },
  });

  revalidatePath("/settings/admin");
  revalidatePath("/settings/admin/shipping");
  revalidatePath("/");
}
