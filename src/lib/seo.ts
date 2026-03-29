export {
  SEO_DEFAULT_DESCRIPTION as APP_DESCRIPTION,
  SEO_DEFAULT_LOGO_PATH as APP_LOGO,
  SEO_DEFAULT_TWITTER_HANDLE as APP_TWITTER,
  SEO_SITE_NAME as APP_NAME,
  LEGACY_APP_LOGO_URLS,
} from "@/lib/seo/seo.constants";
export { buildAbsoluteUrl as absoluteUrl } from "@/lib/seo/seo.utils";
export { sanitizeDescription as toSeoDescription } from "@/lib/seo/seo.utils";

import { getSiteUrl } from "@/lib/seo/seo.utils";

export const APP_URL = getSiteUrl();
