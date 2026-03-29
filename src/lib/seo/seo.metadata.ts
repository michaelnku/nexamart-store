import type { Metadata } from "next";

import {
  SEO_DEFAULT_AUTHOR,
  SEO_DEFAULT_CATEGORY,
  SEO_DEFAULT_CREATOR,
  SEO_DEFAULT_LOCALE,
  SEO_DEFAULT_OG_IMAGE_PATH,
  SEO_DEFAULT_PUBLISHER,
  SEO_DEFAULT_TITLE,
} from "./seo.constants";
import { getResolvedSeoSiteConfig } from "./seo.defaults";
import { STATIC_SEO_PAGES } from "./seo.routes";
import type {
  SeoCategory,
  SeoImageInput,
  SeoMetadataInput,
  SeoProduct,
  SeoStore,
  StaticSeoPageKey,
} from "./seo.types";
import {
  buildCanonicalUrl,
  mergeOpenGraphImages,
  sanitizeDescription,
  sanitizeKeywords,
  sanitizeTitle,
} from "./seo.utils";

function createMetadataImage(input: SeoImageInput) {
  return {
    url: input.url,
    alt: input.alt,
    width: input.width,
    height: input.height,
  };
}

export async function buildRootMetadata(): Promise<Metadata> {
  const config = await getResolvedSeoSiteConfig();
  const defaultImage = mergeOpenGraphImages([
    {
      url: config.defaultOgImagePath,
      alt: `${config.siteName} marketplace preview`,
    },
  ])[0];

  return {
    metadataBase: config.metadataBase,
    title: {
      default: sanitizeTitle(config.defaultTitle, SEO_DEFAULT_TITLE),
      template: config.titleTemplate,
    },
    description: config.description,
    applicationName: config.siteName,
    category: SEO_DEFAULT_CATEGORY,
    generator: "Next.js",
    authors: [{ name: SEO_DEFAULT_AUTHOR }],
    creator: SEO_DEFAULT_CREATOR,
    publisher: SEO_DEFAULT_PUBLISHER,
    keywords: [...config.keywords],
    alternates: {
      canonical: buildCanonicalUrl("/"),
    },
    icons: {
      icon: "/favicon.ico",
      shortcut: "/favicon.ico",
      apple: "/apple-touch-icon.png",
    },
    manifest: "/site.webmanifest",
    openGraph: {
      type: "website",
      locale: SEO_DEFAULT_LOCALE,
      url: buildCanonicalUrl("/"),
      siteName: config.siteName,
      title: sanitizeTitle(config.defaultTitle, SEO_DEFAULT_TITLE),
      description: config.description,
      images: [createMetadataImage(defaultImage)],
    },
    twitter: {
      card: "summary_large_image",
      title: sanitizeTitle(config.defaultTitle, SEO_DEFAULT_TITLE),
      description: config.description,
      site: config.twitterHandle ?? undefined,
      creator: config.twitterHandle ?? undefined,
      images: [defaultImage.url],
    },
  };
}

export function buildSeoMetadata(input: SeoMetadataInput): Metadata {
  const title = sanitizeTitle(input.title);
  const description = sanitizeDescription(input.description);
  const canonical =
    input.canonicalUrl ?? (input.path ? buildCanonicalUrl(input.path) : undefined);
  const fallbackImage = input.fallbackImage ?? {
    url: SEO_DEFAULT_OG_IMAGE_PATH,
    alt: title,
  };
  const images = mergeOpenGraphImages(input.images, fallbackImage);
  const keywords = sanitizeKeywords(input.keywords);

  return {
    ...(input.title ? { title } : {}),
    description,
    ...(canonical
      ? {
          alternates: {
            canonical,
          },
        }
      : {}),
    ...(keywords ? { keywords } : {}),
    openGraph: {
      title,
      description,
      url: canonical,
      type: input.openGraphType ?? "website",
      images: images.map(createMetadataImage),
    },
    twitter: {
      card: input.twitterCard ?? "summary_large_image",
      title,
      description,
      images: images.map((image) => image.url),
    },
  };
}

export function buildStaticPageMetadata(key: StaticSeoPageKey): Metadata {
  const page = STATIC_SEO_PAGES[key];

  if (key === "home") {
    return buildSeoMetadata({
      description: page.description,
      path: page.path,
      keywords: page.keywords,
    });
  }

  return buildSeoMetadata({
    title: page.title,
    description: page.description,
    path: page.path,
    keywords: page.keywords,
  });
}

export function buildNoIndexMetadata(
  input: Pick<SeoMetadataInput, "title" | "description" | "path"> = {},
): Metadata {
  return buildSeoMetadata(input);
}

export function buildProductMetadata(
  product: SeoProduct,
  canonicalPath: string,
): Metadata {
  const lowestPrice =
    product.variants.length > 0
      ? Math.min(...product.variants.map((variant) => variant.priceUSD))
      : product.basePriceUSD;

  return buildSeoMetadata({
    title: product.name,
    description: sanitizeDescription(product.description, product.name),
    path: canonicalPath,
    keywords: [
      product.name,
      product.brand ?? "",
      product.category?.name ?? "",
      product.store?.name ?? "",
      `${lowestPrice} USD`,
    ],
    images: product.images[0]
      ? [
          {
            url: product.images[0].imageUrl,
            alt: product.name,
          },
        ]
      : undefined,
  });
}

export function buildStoreMetadata(store: SeoStore): Metadata {
  return buildSeoMetadata({
    title: store.name,
    description: sanitizeDescription(
      store.tagline ?? store.description,
      `Discover ${store.name} on NexaMart.`,
    ),
    path: `/store/${store.slug}`,
    keywords: [store.name, "storefront", "seller store"],
    images: [
      {
        url: store.bannerImage || store.logo || SEO_DEFAULT_OG_IMAGE_PATH,
        alt: `${store.name} storefront`,
      },
    ],
  });
}

export function buildCategoryMetadata(category: SeoCategory): Metadata {
  return buildSeoMetadata({
    title: category.name,
    description: sanitizeDescription(
      category.description,
      `Browse ${category.name} products on NexaMart.`,
    ),
    path: `/category/${category.slug}`,
    keywords: [category.name, "marketplace category", "shop by category"],
    images: [
      {
        url:
          category.bannerImage || category.iconImage || SEO_DEFAULT_OG_IMAGE_PATH,
        alt: `${category.name} category`,
      },
    ],
  });
}
