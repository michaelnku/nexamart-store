"use server";

import {
  siteConfigurationSchema,
  siteConfigurationSchemaType,
} from "@/lib/zodValidation";
import { SiteConfig } from "@/lib/types";
import {
  getAdminSiteConfiguration,
  getOrCreateSiteConfiguration as getOrCreateSiteConfigurationFromService,
  updateSiteConfiguration as updateSiteConfigurationFromService,
} from "@/lib/site-config/siteConfig.service";
import type { SiteConfigurationMutableInput } from "@/lib/site-config/siteConfig.types";

type SiteConfigurationResult =
  | { success: true; data: SiteConfig | null }
  | { success: false; error: string };

export async function getSiteConfiguration() {
  return getAdminSiteConfiguration();
}

export async function getOrCreateSiteConfiguration() {
  return getOrCreateSiteConfigurationFromService();
}

export async function updateSiteConfigurationFields(
  data: SiteConfigurationMutableInput,
) {
  return updateSiteConfigurationFromService(data);
}

export async function updateSiteConfiguration(
  data: siteConfigurationSchemaType,
): Promise<SiteConfigurationResult> {
  const parsed = siteConfigurationSchema.safeParse(data);

  if (!parsed.success) {
    const issue = parsed.error.issues[0];

    return {
      success: false,
      error: issue?.message ?? "Invalid site configuration payload.",
    };
  }

  try {
    const normalized = parsed.data;

    if (normalized.siteLogo) {
      return {
        success: false,
        error:
          "Legacy site configuration updates cannot change the logo without a file asset key.",
      };
    }

    const updated = await updateSiteConfigurationFromService({
      ...normalized,
    });

    return {
      success: true,
      data: updated,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unable to save settings.",
    };
  }
}
