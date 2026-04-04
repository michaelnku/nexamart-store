import "server-only";

import { revalidatePath, revalidateTag } from "next/cache";

import type { SiteConfiguration } from "@/generated/prisma/client";
import { createAuditLog } from "@/lib/audit/service";
import { CurrentUser } from "@/lib/currentUser";
import { ensureFileAsset } from "@/lib/file-assets";
import { mapSiteConfigurationMedia, siteConfigurationMediaInclude } from "@/lib/media-views";
import { prisma } from "@/lib/prisma";
import { touchOrMarkFileAssetOrphaned } from "@/lib/product-images";
import type { SiteConfig } from "@/lib/types";

import {
  DEFAULT_SITE_CONFIGURATION_VALUES,
  SITE_CONFIG_CACHE_TAG,
  SITE_CONFIGURATION_ID,
  getSiteConfigurationUpdateKeys,
} from "./siteConfig.defaults";
import type {
  AdminSiteConfiguration,
  SiteConfigurationMutableInput,
} from "./siteConfig.types";

function mapAdminSiteConfiguration(
  config: SiteConfiguration & {
    siteLogoFileAsset?: { url: string; storageKey: string } | null;
  },
): AdminSiteConfiguration {
  const mapped = mapSiteConfigurationMedia(config);

  return {
    ...mapped,
    siteLogoFileAssetId: config.siteLogoFileAssetId,
  };
}

export async function getOrCreateSiteConfiguration() {
  const existing =
    (await prisma.siteConfiguration.findUnique({
      where: { id: SITE_CONFIGURATION_ID },
      include: siteConfigurationMediaInclude,
    })) ??
    (await prisma.siteConfiguration.findFirst({
      include: siteConfigurationMediaInclude,
    }));

  if (existing) {
    if (existing.id !== SITE_CONFIGURATION_ID) {
      const normalized = await prisma.siteConfiguration.update({
        where: { id: existing.id },
        data: { id: SITE_CONFIGURATION_ID },
        include: siteConfigurationMediaInclude,
      });

      return mapAdminSiteConfiguration(normalized);
    }

    return mapAdminSiteConfiguration(existing);
  }

  const created = await prisma.siteConfiguration.create({
    data: {
      id: SITE_CONFIGURATION_ID,
      ...DEFAULT_SITE_CONFIGURATION_VALUES,
    },
    include: siteConfigurationMediaInclude,
  });

  return mapAdminSiteConfiguration(created);
}

export async function getAdminSiteConfiguration(): Promise<AdminSiteConfiguration> {
  return getOrCreateSiteConfiguration();
}

export async function updateSiteConfiguration(
  input: SiteConfigurationMutableInput,
) {
  const currentUser = await CurrentUser();

  if (!currentUser || currentUser.role !== "ADMIN") {
    throw new Error("Unauthorized");
  }

  const result = await prisma.$transaction(async (tx) => {
    const existing =
      (await tx.siteConfiguration.findUnique({
        where: { id: SITE_CONFIGURATION_ID },
        include: siteConfigurationMediaInclude,
      })) ??
      (await tx.siteConfiguration.findFirst({
        include: siteConfigurationMediaInclude,
      }));

    const nextLogo =
      input.siteLogo === undefined
        ? undefined
        : input.siteLogo
          ? await ensureFileAsset(tx, {
              uploadedById: currentUser.id,
              file: input.siteLogo,
              category: "OTHER",
              kind: "IMAGE",
              isPublic: true,
            })
          : null;

    const { siteLogo, ...rest } = input;

    const updated = existing
      ? await tx.siteConfiguration.update({
          where: { id: existing.id },
          data: {
            ...(existing.id !== SITE_CONFIGURATION_ID
              ? { id: SITE_CONFIGURATION_ID }
              : {}),
            ...rest,
            siteLogoFileAssetId:
              nextLogo === undefined ? undefined : nextLogo?.id ?? null,
          },
          include: siteConfigurationMediaInclude,
        })
      : await tx.siteConfiguration.create({
          data: {
            id: SITE_CONFIGURATION_ID,
            ...DEFAULT_SITE_CONFIGURATION_VALUES,
            ...rest,
            siteLogoFileAssetId: nextLogo?.id ?? null,
          },
          include: siteConfigurationMediaInclude,
        });

    if (
      existing?.siteLogoFileAssetId &&
      existing.siteLogoFileAssetId !== nextLogo?.id
    ) {
      await touchOrMarkFileAssetOrphaned(tx, existing.siteLogoFileAssetId);
    }

    const changedFields = getSiteConfigurationUpdateKeys(input);
    const logoChanged = input.siteLogo !== undefined;

    await createAuditLog(
      {
        actorId: currentUser.id,
        actorRole: currentUser.role,
        actionType:
          changedFields.some((field) =>
            [
              "foodMinimumDeliveryFee",
              "generalMinimumDeliveryFee",
              "foodBaseDeliveryRate",
              "foodRatePerMile",
              "generalBaseDeliveryRate",
              "generalRatePerMile",
              "expressMultiplier",
              "pickupFee",
            ].includes(field),
          ) && changedFields.length > 0
            ? "SHIPPING_SETTINGS_UPDATED"
            : "PLATFORM_SETTINGS_UPDATED",
        targetEntityType: "SITE_CONFIGURATION",
        targetEntityId: updated.id,
        summary: "Updated site configuration.",
        metadata: {
          changedFields,
          actorId: currentUser.id,
          logoChanged,
        },
      },
      tx,
    );

    return mapAdminSiteConfiguration(updated);
  });

  revalidateTag(SITE_CONFIG_CACHE_TAG);
  revalidatePath("/");
  revalidatePath("/auth/login");
  revalidatePath("/auth/register");
  revalidatePath("/settings/admin");
  revalidatePath("/settings/admin/platform");
  revalidatePath("/settings/admin/marketing");
  revalidatePath("/settings/admin/security");
  revalidatePath("/settings/admin/payments");
  revalidatePath("/settings/admin/shipping");

  return result;
}

export function serializeSiteConfigurationForLegacyConsumer(
  config: AdminSiteConfiguration,
): SiteConfig {
  return config;
}
