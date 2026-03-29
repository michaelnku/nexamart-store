import {
  SEO_DEFAULT_LOGO_PATH,
  SEO_SITE_NAME,
} from "./seo.constants";
import type {
  JsonLd,
  SeoBreadcrumbItem,
  SeoCategory,
  SeoProduct,
  SeoStore,
} from "./seo.types";
import { buildAbsoluteUrl, sanitizeDescription } from "./seo.utils";

export function buildOrganizationStructuredData(input?: {
  siteName?: string;
  description?: string | null;
  logoPath?: string | null;
  socialProfiles?: string[];
}): JsonLd {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: input?.siteName || SEO_SITE_NAME,
    url: buildAbsoluteUrl("/"),
    logo: buildAbsoluteUrl(input?.logoPath || SEO_DEFAULT_LOGO_PATH),
    sameAs: input?.socialProfiles ?? [],
    description: sanitizeDescription(input?.description),
  };
}

export function buildWebsiteStructuredData(input?: {
  siteName?: string;
  description?: string | null;
}): JsonLd {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: input?.siteName || SEO_SITE_NAME,
    url: buildAbsoluteUrl("/"),
    description: sanitizeDescription(input?.description),
    potentialAction: {
      "@type": "SearchAction",
      target: `${buildAbsoluteUrl("/search")}?q={search_term_string}`,
      "query-input": "required name=search_term_string",
    },
  };
}

export function buildBreadcrumbStructuredData(
  items: SeoBreadcrumbItem[],
): JsonLd {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: buildAbsoluteUrl(item.path),
    })),
  };
}

function getProductAvailability(product: SeoProduct): string {
  if (product.foodProductConfig) {
    if (
      product.foodProductConfig.isAvailable &&
      !product.foodProductConfig.isSoldOut
    ) {
      return "https://schema.org/InStock";
    }

    return "https://schema.org/OutOfStock";
  }

  return product.variants.some((variant) => variant.stock > 0)
    ? "https://schema.org/InStock"
    : "https://schema.org/OutOfStock";
}

export function buildProductStructuredData(input: {
  product: SeoProduct;
  canonicalPath: string;
  image?: string | null;
}): JsonLd {
  const { product } = input;
  const prices = product.variants.map((variant) => variant.priceUSD);
  const lowPrice =
    prices.length > 0 ? Math.min(...prices) : product.basePriceUSD;
  const highPrice =
    prices.length > 0 ? Math.max(...prices) : product.basePriceUSD;

  return {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    description: sanitizeDescription(product.description, product.name),
    image: input.image ? [buildAbsoluteUrl(input.image)] : undefined,
    brand: product.brand
      ? {
          "@type": "Brand",
          name: product.brand,
        }
      : undefined,
    category: product.category?.name,
    sku: product.id,
    url: buildAbsoluteUrl(input.canonicalPath),
    offers: {
      "@type": "AggregateOffer",
      url: buildAbsoluteUrl(input.canonicalPath),
      priceCurrency: "USD",
      lowPrice,
      highPrice,
      offerCount: Math.max(product.variants.length, 1),
      availability: getProductAvailability(product),
    },
    aggregateRating:
      product.reviewCount > 0 && product.averageRating > 0
        ? {
            "@type": "AggregateRating",
            ratingValue: Number(product.averageRating.toFixed(1)),
            reviewCount: product.reviewCount,
          }
        : undefined,
  };
}

export function buildStoreStructuredData(store: SeoStore): JsonLd {
  return {
    "@context": "https://schema.org",
    "@type": "Store",
    name: store.name,
    url: buildAbsoluteUrl(`/store/${store.slug}`),
    image: store.bannerImage
      ? [buildAbsoluteUrl(store.bannerImage)]
      : store.logo
        ? [buildAbsoluteUrl(store.logo)]
        : undefined,
    description: sanitizeDescription(
      store.tagline ?? store.description,
      `Discover ${store.name} on ${SEO_SITE_NAME}.`,
    ),
    aggregateRating:
      (store.reviewCount ?? 0) > 0 && (store.averageRating ?? 0) > 0
        ? {
            "@type": "AggregateRating",
            ratingValue: Number((store.averageRating ?? 0).toFixed(1)),
            reviewCount: store.reviewCount,
          }
        : undefined,
  };
}

export function buildCollectionPageStructuredData(input: {
  name: string;
  description: string;
  path: string;
}): JsonLd {
  return {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: input.name,
    description: sanitizeDescription(input.description),
    url: buildAbsoluteUrl(input.path),
    isPartOf: {
      "@type": "WebSite",
      name: SEO_SITE_NAME,
      url: buildAbsoluteUrl("/"),
    },
  };
}

export function buildCategoryCollectionStructuredData(category: SeoCategory): JsonLd {
  return buildCollectionPageStructuredData({
    name: category.name,
    description: sanitizeDescription(
      category.description,
      `Browse ${category.name} products on ${SEO_SITE_NAME}.`,
    ),
    path: `/category/${category.slug}`,
  });
}

export function serializeJsonLd(...entries: Array<JsonLd | null | undefined>): string {
  const payload = entries.filter(Boolean);
  return JSON.stringify(payload.length === 1 ? payload[0] : payload);
}
