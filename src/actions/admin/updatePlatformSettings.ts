"use server";

import { CurrentUser } from "@/lib/currentUser";
import { platformSettingsFormSchema } from "@/lib/site-config/siteConfig.schema";
import { updateSiteConfiguration } from "@/lib/site-config/siteConfig.service";

export async function updatePlatformSettings(
  formData: FormData,
): Promise<{ success: boolean; error?: string }> {
  const currentUser = await CurrentUser();
  if (!currentUser || currentUser.role !== "ADMIN") {
    return {
      success: false,
      error: "You are not authorized to update site settings.",
    };
  }

  const parsed = platformSettingsFormSchema.safeParse({
    siteName: formData.get("siteName")?.toString(),
    siteEmail: formData.get("siteEmail")?.toString(),
    sitePhone: formData.get("sitePhone")?.toString(),
    supportEmail: formData.get("supportEmail")?.toString(),
    supportPhone: formData.get("supportPhone")?.toString(),
    whatsappPhone: formData.get("whatsappPhone")?.toString(),
    facebookUrl: formData.get("facebookUrl")?.toString(),
    instagramUrl: formData.get("instagramUrl")?.toString(),
    twitterUrl: formData.get("twitterUrl")?.toString(),
    youtubeUrl: formData.get("youtubeUrl")?.toString(),
    tiktokUrl: formData.get("tiktokUrl")?.toString(),
    seoTitle: formData.get("seoTitle")?.toString(),
    seoDescription: formData.get("seoDescription")?.toString(),
    siteLogoUrl: formData.get("siteLogoUrl")?.toString(),
    siteLogoKey: formData.get("siteLogoKey")?.toString(),
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

  try {
    await updateSiteConfiguration(parsed.data);

    return { success: true };
  } catch (error) {
    console.error("Failed to update site settings", error);

    return {
      success: false,
      error: "We couldn't save your site settings right now. Please try again.",
    };
  }
}
