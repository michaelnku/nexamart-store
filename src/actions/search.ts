"use server";

import { prisma } from "@/lib/prisma";

export type SearchParams = {
  query: string;
  limit?: number;
  cursor?: string | null;
};

export async function globalSearchAction({
  query,
  limit = 12,
  cursor,
}: SearchParams) {
  if (!query || query.trim().length < 2) {
    return {
      products: [],
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
        {
          category: {
            name: { contains: q, mode: "insensitive" },
          },
        },
        {
          store: {
            name: { contains: q, mode: "insensitive" },
          },
        },
      ],
    },

    take: limit + 1, // fetch one extra to detect next page
    cursor: cursor ? { id: cursor } : undefined,
    skip: cursor ? 1 : 0,

    include: {
      images: { take: 1 },
      store: {
        select: { id: true, name: true, slug: true },
      },
      category: {
        select: { id: true, name: true, slug: true },
      },
    },

    orderBy: {
      createdAt: "desc",
    },
  });

  let nextCursor: string | null = null;

  if (products.length > limit) {
    const nextItem = products.pop();
    nextCursor = nextItem!.id;
  }

  return {
    products,
    nextCursor,
  };
}
