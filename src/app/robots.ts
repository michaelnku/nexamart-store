import type { MetadataRoute } from "next";

import { ROBOTS_DISALLOW_PATHS } from "@/lib/seo/seo.routes";
import { buildAbsoluteUrl, getSiteUrl } from "@/lib/seo/seo.utils";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: [...ROBOTS_DISALLOW_PATHS],
    },
    sitemap: buildAbsoluteUrl("/sitemap.xml"),
    host: getSiteUrl(),
  };
}
