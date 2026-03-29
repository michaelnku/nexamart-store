import { SiteConfig } from "@/lib/types";
import { getAdminSiteConfiguration } from "@/lib/site-config/siteConfig.service";

export async function getSiteConfig(): Promise<SiteConfig | null> {
  return getAdminSiteConfiguration();
}
