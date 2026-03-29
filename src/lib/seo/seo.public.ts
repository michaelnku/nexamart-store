import { cache } from "react";

import { prisma } from "@/lib/prisma";
import {
  categoryMediaInclude,
  mapCategoryMedia,
  mapStoreMedia,
  storeMediaInclude,
} from "@/lib/media-views";
import {
  mapRecordProductImages,
  productImageWithAssetInclude,
} from "@/lib/product-images";

export const getPublicCategoryBySlug = cache(async (slug: string) => {
  const category = await prisma.category.findUnique({
    where: { slug },
    include: {
      ...categoryMediaInclude,
      parent: {
        include: {
          parent: {
            include: categoryMediaInclude,
          },
          ...categoryMediaInclude,
        },
      },
      children: {
        include: categoryMediaInclude,
      },
    },
  });

  if (!category) {
    return null;
  }

  return {
    ...mapCategoryMedia(category),
    parent: category.parent
      ? {
          ...mapCategoryMedia(category.parent),
          parent: category.parent.parent
            ? mapCategoryMedia(category.parent.parent)
            : null,
        }
      : null,
    children: category.children.map(mapCategoryMedia),
  };
});

export async function getCategoryAndDescendantIds(categoryId: string) {
  const categories = await prisma.category.findMany({
    where: {
      OR: [
        { id: categoryId },
        { parentId: categoryId },
        {
          parent: {
            parentId: categoryId,
          },
        },
      ],
    },
    select: { id: true },
  });

  return categories.map((category) => category.id);
}

export const getPublicStoreBySlug = cache(async (slug: string) => {
  const store = await prisma.store.findUnique({
    where: { slug },
    include: {
      ...storeMediaInclude,
      products: {
        include: {
          images: {
            include: productImageWithAssetInclude,
          },
        },
      },
      owner: true,
      _count: {
        select: { StoreFollower: true },
      },
    },
  });

  return store ? mapStoreMedia(store) : null;
});

export const getPublicProductById = cache(async (productId: string) => {
  const product = await prisma.product.findUnique({
    where: { id: productId },
    include: {
      images: {
        include: productImageWithAssetInclude,
      },
      variants: {
        orderBy: { priceUSD: "asc" },
      },
      foodProductConfig: true,
      foodOptionGroups: {
        where: { isActive: true },
        orderBy: { displayOrder: "asc" },
        include: {
          options: {
            orderBy: { displayOrder: "asc" },
          },
        },
      },
      store: {
        include: storeMediaInclude,
      },
      category: {
        select: {
          name: true,
          slug: true,
        },
      },
      reviews: {
        include: {
          user: { select: { id: true, name: true, image: true } },
        },
      },
    },
  });

  if (!product) {
    return null;
  }

  return {
    ...mapRecordProductImages(product),
    store: mapStoreMedia(product.store),
  };
});
