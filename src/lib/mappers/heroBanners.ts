import { HeroBanner } from "@/generated/prisma";
import { BannerFile, HeroBannerWithFiles } from "@/lib/types";

export function mapHeroBanner(banner: HeroBanner): HeroBannerWithFiles {
  return {
    ...banner,
    backgroundImage: banner.backgroundImage as BannerFile,
    productImage: banner.productImage as BannerFile | null,
  };
}

export function mapHeroBanners(banners: HeroBanner[]): HeroBannerWithFiles[] {
  return banners.map(mapHeroBanner);
}
