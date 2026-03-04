import { prisma } from "@/lib/prisma";
import { SiteConfig } from "@/lib/types";

export async function getSiteConfig(): Promise<SiteConfig | null> {
  const config = await prisma.siteConfiguration.findUnique({
    where: { singleton: true },
  });

  return config;
}
