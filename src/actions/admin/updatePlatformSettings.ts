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
  });

const platformSettingsSchema = z.object({
  siteName: z.string().trim().optional(),
  siteEmail: z.string().trim().email("Invalid site email").optional(),
  sitePhone: optionalTrimmedField.optional(),
  siteLogo: optionalTrimmedField.optional(),
  platformCommissionPercent: optionalNumberField.optional(),
});

type PlatformSettingsResult = { success: true } | { success: false; error: string };

export async function updatePlatformSettings(
  formData: FormData,
): Promise<PlatformSettingsResult> {
  const role = await CurrentRole();
  if (role !== "ADMIN") {
    return { success: false, error: "Unauthorized" };
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
    return {
      success: false,
      error: parsed.error.issues[0]?.message ?? "Invalid platform settings",
    };
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

  return { success: true };
}
