"use server";

import { CurrentRole } from "@/lib/currentUser";
import { ensureFileAsset } from "@/lib/file-assets";
import { mapSiteConfigurationMedia, siteConfigurationMediaInclude } from "@/lib/media-views";
import { prisma } from "@/lib/prisma";
import { touchOrMarkFileAssetOrphaned } from "@/lib/product-images";
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
  siteLogoFileAssetId: null,

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
  const config = await prisma.siteConfiguration.findUnique({
    where: { singleton: true },
    include: siteConfigurationMediaInclude,
  });

  return config ? mapSiteConfigurationMedia(config) : null;
}

export async function getOrCreateSiteConfiguration() {
  const existing = await getSiteConfiguration();
  if (existing) return existing;

  return prisma.siteConfiguration.create({
    data: DEFAULT_SITE_CONFIGURATION,
    include: siteConfigurationMediaInclude,
  }).then(mapSiteConfigurationMedia);
}

type SiteConfigurationMutableFields = Partial<
  Pick<
    SiteConfiguration,
    | "siteName"
    | "siteEmail"
    | "sitePhone"
    | "siteLogoFileAssetId"
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
  data: SiteConfigurationMutableFields & {
    siteLogo?: string | null;
    siteLogoKey?: string | null;
  },
) {
  return prisma.$transaction(async (tx) => {
    const existing = await tx.siteConfiguration.findUnique({
      where: { singleton: true },
      include: siteConfigurationMediaInclude,
    });

    const nextSiteLogoAsset =
      data.siteLogo === undefined
        ? undefined
        : data.siteLogo
          ? await ensureFileAsset(tx, {
              url: data.siteLogo,
              storageKey: data.siteLogoKey ?? null,
              category: "OTHER",
              kind: "IMAGE",
              isPublic: true,
            })
          : null;

    const { siteLogo, siteLogoKey, ...rest } = data;

    const updated = await tx.siteConfiguration.upsert({
      where: { singleton: true },
      update: {
        ...rest,
        siteLogoFileAssetId:
          nextSiteLogoAsset === undefined ? undefined : nextSiteLogoAsset?.id ?? null,
      },
      create: {
        ...DEFAULT_SITE_CONFIGURATION,
        ...rest,
        siteLogoFileAssetId: nextSiteLogoAsset?.id ?? null,
      },
      include: siteConfigurationMediaInclude,
    });

    if (
      existing?.siteLogoFileAssetId &&
      existing.siteLogoFileAssetId !== nextSiteLogoAsset?.id
    ) {
      await touchOrMarkFileAssetOrphaned(tx, existing.siteLogoFileAssetId);
    }

    return mapSiteConfigurationMedia(updated);
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
