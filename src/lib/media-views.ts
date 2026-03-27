import { Prisma } from "@/generated/prisma";
import type { Prisma as PrismaNamespace } from "@/generated/prisma";
import {
  mapFileAssetToJsonFile,
  mapOptionalFileAssetToJsonFile,
} from "@/lib/file-assets";

export const userProfileAvatarInclude =
  Prisma.validator<PrismaNamespace.UserInclude>()({
    profileAvatarFileAsset: true,
  });

export const storeMediaInclude =
  Prisma.validator<PrismaNamespace.StoreInclude>()({
    logoFileAsset: true,
    bannerImageFileAsset: true,
  });

export const categoryMediaInclude =
  Prisma.validator<PrismaNamespace.CategoryInclude>()({
    iconImageFileAsset: true,
    bannerImageFileAsset: true,
  });

export const heroBannerMediaInclude =
  Prisma.validator<PrismaNamespace.HeroBannerInclude>()({
    backgroundImageFileAsset: true,
    productImageFileAsset: true,
  });

export const siteConfigurationMediaInclude =
  Prisma.validator<PrismaNamespace.SiteConfigurationInclude>()({
    siteLogoFileAsset: true,
  });

export const verificationDocumentMediaInclude =
  Prisma.validator<PrismaNamespace.VerificationDocumentInclude>()({
    fileAsset: true,
  });

export function mapUserProfileAvatar<
  T extends {
    profileAvatarFileAsset?: { storageKey: string; url: string } | null;
  },
>(user: T): Omit<T, "profileAvatarFileAsset"> & { profileAvatar: ReturnType<typeof mapOptionalFileAssetToJsonFile> } {
  const { profileAvatarFileAsset, ...rest } = user;

  return {
    ...rest,
    profileAvatar: mapOptionalFileAssetToJsonFile(profileAvatarFileAsset),
  };
}

export function mapStoreMedia<
  T extends {
    logoFileAsset?: { storageKey: string; url: string } | null;
    bannerImageFileAsset?: { storageKey: string; url: string } | null;
  },
>(
  store: T,
): Omit<T, "logoFileAsset" | "bannerImageFileAsset"> & {
  logo: string | null;
  logoKey: string | null;
  bannerImage: string | null;
  bannerKey: string | null;
} {
  const { logoFileAsset, bannerImageFileAsset, ...rest } = store;

  return {
    ...rest,
    logo: logoFileAsset?.url ?? null,
    logoKey: logoFileAsset?.storageKey ?? null,
    bannerImage: bannerImageFileAsset?.url ?? null,
    bannerKey: bannerImageFileAsset?.storageKey ?? null,
  };
}

export function mapCategoryMedia<
  T extends {
    iconImageFileAsset?: { storageKey: string; url: string } | null;
    bannerImageFileAsset?: { storageKey: string; url: string } | null;
  },
>(
  category: T,
): Omit<T, "iconImageFileAsset" | "bannerImageFileAsset"> & {
  iconImage: string | null;
  bannerImage: string | null;
  iconUrl: string | null;
  bannerUrl: string | null;
} {
  const { iconImageFileAsset, bannerImageFileAsset, ...rest } = category;

  return {
    ...rest,
    iconImage: iconImageFileAsset?.url ?? null,
    bannerImage: bannerImageFileAsset?.url ?? null,
    iconUrl: iconImageFileAsset?.url ?? null,
    bannerUrl: bannerImageFileAsset?.url ?? null,
  };
}

export function mapHeroBannerMedia<
  T extends {
    backgroundImageFileAsset?: { storageKey: string; url: string } | null;
    productImageFileAsset?: { storageKey: string; url: string } | null;
  },
>(
  banner: T,
): Omit<T, "backgroundImageFileAsset" | "productImageFileAsset"> & {
  backgroundImage: ReturnType<typeof mapOptionalFileAssetToJsonFile>;
  productImage: ReturnType<typeof mapOptionalFileAssetToJsonFile>;
} {
  const { backgroundImageFileAsset, productImageFileAsset, ...rest } = banner;

  return {
    ...rest,
    backgroundImage: mapOptionalFileAssetToJsonFile(backgroundImageFileAsset),
    productImage: mapOptionalFileAssetToJsonFile(productImageFileAsset),
  };
}

export function mapSiteConfigurationMedia<
  T extends {
    siteLogoFileAsset?: { storageKey: string; url: string } | null;
  },
>(
  config: T,
): Omit<T, "siteLogoFileAsset"> & {
  siteLogo: string | null;
  siteLogoKey: string | null;
} {
  const { siteLogoFileAsset, ...rest } = config;

  return {
    ...rest,
    siteLogo: siteLogoFileAsset?.url ?? null,
    siteLogoKey: siteLogoFileAsset?.storageKey ?? null,
  };
}

export function mapVerificationDocumentFile<
  T extends {
    fileAsset: { storageKey: string; url: string };
  },
>(document: T): Omit<T, "fileAsset"> & { file: ReturnType<typeof mapFileAssetToJsonFile> } {
  const { fileAsset, ...rest } = document;

  return {
    ...rest,
    file: mapFileAssetToJsonFile(fileAsset),
  };
}
