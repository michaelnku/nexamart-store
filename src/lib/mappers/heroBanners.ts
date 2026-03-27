import { HeroBanner } from "@/generated/prisma";
import { mapOptionalFileAssetToJsonFile } from "@/lib/file-assets";
import { BannerFile, HeroBannerWithFiles } from "@/lib/types";

export function mapHeroBanner(
  banner: HeroBanner & {
    backgroundImageFileAsset?: { storageKey: string; url: string } | null;
    productImageFileAsset?: { storageKey: string; url: string } | null;
  },
): HeroBannerWithFiles {
  const { backgroundImageFileAsset, productImageFileAsset, ...rest } = banner;

  return {
    ...rest,
    backgroundImage:
      mapOptionalFileAssetToJsonFile(backgroundImageFileAsset) as BannerFile,
    productImage:
      mapOptionalFileAssetToJsonFile(productImageFileAsset) as BannerFile | null,
  };
}

export function mapHeroBanners(
  banners: Array<
    HeroBanner & {
      backgroundImageFileAsset?: { storageKey: string; url: string } | null;
      productImageFileAsset?: { storageKey: string; url: string } | null;
    }
  >,
): HeroBannerWithFiles[] {
  return banners.map(mapHeroBanner);
}
