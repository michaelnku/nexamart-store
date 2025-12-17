"use server";

import { CurrentUserId } from "@/lib/currentUser";
import { prisma } from "@/lib/prisma";
import { GlobalSearchResult } from "@/lib/types";

export type SearchParams = {
  query: string;
  limit?: number;
  cursor?: string | null;
};

export async function globalSearchAction({
  query,
  limit = 12,
  cursor,
}: SearchParams): Promise<GlobalSearchResult> {
  if (!query || query.trim().length < 2) {
    return {
      products: [],
      stores: [],
      categories: [],
      nextCursor: null,
    };
  }

  const q = query.trim();

  const products = await prisma.product.findMany({
    where: {
      isPublished: true,
      OR: [
        { name: { contains: q, mode: "insensitive" } },
        { description: { contains: q, mode: "insensitive" } },
      ],
    },
    take: limit + 1,
    cursor: cursor ? { id: cursor } : undefined,
    skip: cursor ? 1 : 0,
    include: {
      images: { take: 1 },
      store: { select: { id: true, name: true, slug: true } },
      category: { select: { id: true, name: true, slug: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  let nextCursor: string | null = null;
  if (products.length > limit) {
    const nextItem = products.pop();
    nextCursor = nextItem!.id;
  }

  const stores = await prisma.store.findMany({
    where: {
      name: { contains: q, mode: "insensitive" },
    },
    take: 6,
    select: {
      id: true,
      name: true,
      slug: true,
      logo: true,
    },
  });

  const categories = await prisma.category.findMany({
    where: {
      name: { contains: q, mode: "insensitive" },
    },
    take: 6,
    select: {
      id: true,
      name: true,
      slug: true,
    },
  });

  return {
    products: products.map((p) => ({
      id: p.id,
      name: p.name,
      priceUSD: p.basePriceUSD,
      images: p.images.map((img) => ({
        imageUrl: img.imageUrl,
      })),
      store: {
        id: p.store.id,
        name: p.store.name,
        slug: p.store.slug ?? undefined,
      },
      category: p.category
        ? {
            id: p.category.id,
            name: p.category.name,
            slug: p.category.slug,
          }
        : null,
    })),

    stores: stores.map((s) => ({
      id: s.id,
      name: s.name,
      slug: s.slug,
      logo: s.logo ?? null,
    })),

    categories: categories.map((c) => ({
      id: c.id,
      name: c.name,
      slug: c.slug,
    })),

    nextCursor,
  };
}

export async function recordSearchAction(query: string) {
  if (!query || query.trim().length < 2) return;

  const normalized = query.toLowerCase().trim();
  const userId = await CurrentUserId();

  await prisma.$transaction([
    prisma.searchHistory.create({
      data: {
        query: normalized,
        userId: userId ?? null,
      },
    }),

    prisma.searchKeyword.upsert({
      where: { keyword: normalized },
      update: { count: { increment: 1 } },
      create: { keyword: normalized, count: 1 },
    }),
  ]);
}

export async function getUserRecentSearches(limit = 6) {
  const userId = await CurrentUserId();
  if (!userId) return [];

  return prisma.searchHistory.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    take: limit,
    distinct: ["query"],
  });
}

export async function getTrendingSearches(limit = 8) {
  return prisma.searchKeyword.findMany({
    orderBy: { count: "desc" },
    take: limit,
  });
}
