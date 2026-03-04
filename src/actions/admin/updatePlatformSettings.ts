"use server";

import { CurrentRole } from "@/lib/currentUser";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { updateSiteConfigurationFields } from "./siteConfig";

const optionalTrimmedField = z
  .string()
  .trim()
  .transform((value) => (value.length > 0 ? value : null));

const optionalNumberField = z
  .string()
  .trim()
  .transform((value) => (value.length > 0 ? Number(value) : undefined))
  .refine((value) => value === undefined || Number.isFinite(value), {
    message: "Invalid numeric value",
  })
  .refine((value) => value === undefined || value >= 0, {
    message: "Value must be greater than or equal to 0",
  });

const platformSettingsSchema = z.object({
  siteName: z.string().trim().min(1, "Site name is required").optional(),
  siteEmail: z.string().trim().email("Invalid site email").optional(),
  sitePhone: optionalTrimmedField.optional(),
  siteLogo: optionalTrimmedField.optional(),
  platformCommissionPercent: optionalNumberField.optional(),
});

export async function updatePlatformSettings(
  formData: FormData,
): Promise<void> {
  const role = await CurrentRole();
  if (role !== "ADMIN") {
    throw new Error("Unauthorized");
  }

  const parsed = platformSettingsSchema.safeParse({
    siteName: formData.get("siteName")?.toString(),
    siteEmail: formData.get("siteEmail")?.toString(),
    sitePhone: formData.get("sitePhone")?.toString(),
    siteLogo: formData.get("siteLogo")?.toString(),
    platformCommissionPercent: formData
      .get("platformCommissionPercent")
      ?.toString(),
  });

  if (!parsed.success) {
    throw new Error(
      parsed.error.issues[0]?.message ?? "Invalid platform settings",
    );
  }

  const updates: {
    siteName?: string;
    siteEmail?: string;
    sitePhone?: string | null;
    siteLogo?: string | null;
    platformCommissionPercent?: number;
  } = {};

  const values = parsed.data;

  if (values.siteName !== undefined) updates.siteName = values.siteName;
  if (values.siteEmail !== undefined) updates.siteEmail = values.siteEmail;
  if (values.sitePhone !== undefined) updates.sitePhone = values.sitePhone;
  if (values.siteLogo !== undefined) updates.siteLogo = values.siteLogo;
  if (values.platformCommissionPercent !== undefined) {
    updates.platformCommissionPercent = values.platformCommissionPercent;
  }

  await updateSiteConfigurationFields(updates);

  revalidatePath("/marketplace/dashboard/settings");
  revalidatePath("/marketplace/dashboard/settings/platform");
  revalidatePath("/marketplace/dashboard/settings/payments");
  revalidatePath("/marketplace/dashboard/settings/marketing");
  revalidatePath("/marketplace/dashboard/settings/security");
  revalidatePath("/marketplace/dashboard/settings/site");
  revalidatePath("/");
}
