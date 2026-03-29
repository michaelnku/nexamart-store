import type { MetadataRoute } from "next";

import { prisma } from "@/lib/prisma";
import { createProductSlug } from "@/lib/search/productSlug";
import { PUBLIC_SITEMAP_STATIC_ROUTES } from "@/lib/seo/seo.routes";
import { buildAbsoluteUrl } from "@/lib/seo/seo.utils";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [products, stores, categories] = await Promise.all([
    prisma.product.findMany({
      where: {
        isPublished: true,
        variants: {
          some: {},
        },
        store: {
          is: {
            isActive: true,
            isDeleted: false,
            isSuspended: false,
          },
        },
      },
      select: {
        id: true,
        name: true,
        updatedAt: true,
      },
      orderBy: {
        updatedAt: "desc",
      },
    }),
    prisma.store.findMany({
      where: {
        isActive: true,
        isDeleted: false,
        isSuspended: false,
      },
      select: {
        slug: true,
        updatedAt: true,
      },
      orderBy: {
        updatedAt: "desc",
      },
    }),
    prisma.category.findMany({
      select: {
        slug: true,
        updatedAt: true,
      },
      orderBy: {
        updatedAt: "desc",
      },
    }),
  ]);

  return [
    ...PUBLIC_SITEMAP_STATIC_ROUTES.map((route) => ({
      url: buildAbsoluteUrl(route.path),
      lastModified: new Date(),
      changeFrequency: route.changeFrequency,
      priority: route.priority,
    })),
    ...products.map((product) => ({
      url: buildAbsoluteUrl(
        `/products/${createProductSlug(product.name, product.id)}`,
      ),
      lastModified: product.updatedAt,
      changeFrequency: "daily" as const,
      priority: 0.8,
    })),
    ...stores.map((store) => ({
      url: buildAbsoluteUrl(`/store/${store.slug}`),
      lastModified: store.updatedAt,
      changeFrequency: "daily" as const,
      priority: 0.7,
    })),
    ...categories.map((category) => ({
      url: buildAbsoluteUrl(`/category/${category.slug}`),
      lastModified: category.updatedAt,
      changeFrequency: "weekly" as const,
      priority: 0.65,
    })),
  ];
}
