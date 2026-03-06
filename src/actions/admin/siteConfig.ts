"use server";

import { CurrentRole } from "@/lib/currentUser";
import { prisma } from "@/lib/prisma";
import { revalidatePath, revalidateTag } from "next/cache";
import {
  siteConfigurationSchema,
  siteConfigurationSchemaType,
} from "@/lib/zodValidation";
import { SiteConfig } from "@/lib/types";
import { SiteConfiguration } from "@/generated/prisma";

type SiteConfigurationResult =
  | { success: true; data: SiteConfig | null }
  | { success: false; error: string };

const DEFAULT_SITE_CONFIGURATION: Omit<
  SiteConfiguration,
  "id" | "createdAt" | "updatedAt"
> = {
  singleton: true,
  siteName: "",
  siteEmail: "",
  sitePhone: null,
  siteLogo: null,

  platformCommissionRate: 0.1,

  foodMinimumDeliveryFee: 2,
  generalMinimumDeliveryFee: 5,

  foodBaseDeliveryRate: 1.5,
  foodRatePerMile: 0.7,

  generalBaseDeliveryRate: 2,
  generalRatePerMile: 1,

  expressMultiplier: 1.5,
  pickupFee: 0,
};

export async function getSiteConfiguration() {
  return prisma.siteConfiguration.findUnique({
    where: { singleton: true },
  });
}

export async function getOrCreateSiteConfiguration() {
  const existing = await getSiteConfiguration();
  if (existing) return existing;

  return prisma.siteConfiguration.create({
    data: DEFAULT_SITE_CONFIGURATION,
  });
}

type SiteConfigurationMutableFields = Partial<
  Pick<
    SiteConfiguration,
    | "siteName"
    | "siteEmail"
    | "sitePhone"
    | "siteLogo"
    | "foodMinimumDeliveryFee"
    | "generalMinimumDeliveryFee"
    | "platformCommissionRate"
    | "foodBaseDeliveryRate"
    | "foodRatePerMile"
    | "generalBaseDeliveryRate"
    | "generalRatePerMile"
    | "expressMultiplier"
    | "pickupFee"
  >
>;

export async function updateSiteConfigurationFields(
  data: SiteConfigurationMutableFields,
) {
  return prisma.siteConfiguration.upsert({
    where: { singleton: true },

    update: data,

    create: {
      ...DEFAULT_SITE_CONFIGURATION,
      ...data,
    },
  });
}

export async function updateSiteConfiguration(
  data: siteConfigurationSchemaType,
): Promise<SiteConfigurationResult> {
  const role = await CurrentRole();

  if (role !== "ADMIN") {
    return { success: false, error: "Unauthorized" };
  }

  const parsed = siteConfigurationSchema.safeParse(data);

  if (!parsed.success) {
    const issue = parsed.error.issues[0];

    return {
      success: false,
      error: issue?.message ?? "Invalid site configuration payload.",
    };
  }

  const normalized = parsed.data;

  await updateSiteConfigurationFields(normalized);

  revalidatePath("/settings/admin");
  revalidateTag("site-config");

  const updated = await getSiteConfiguration();

  return {
    success: true,
    data: updated,
  };
}
