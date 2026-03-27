import { mapSiteConfigurationMedia, siteConfigurationMediaInclude } from "@/lib/media-views";
import { prisma } from "@/lib/prisma";
import { SiteConfig } from "@/lib/types";

export async function getSiteConfig(): Promise<SiteConfig | null> {
  const config = await prisma.siteConfiguration.findUnique({
    where: { singleton: true },
    include: siteConfigurationMediaInclude,
  });

  return config ? mapSiteConfigurationMedia(config) : null;
}
