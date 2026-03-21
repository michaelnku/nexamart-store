import { z } from "zod";
import type { ModeratorProductsFilters } from "@/lib/moderation/getModeratorProducts";

const moderatorProductsPublishedSchema = z.enum(["ALL", "YES", "NO"]);
const moderatorProductsFoodTypeSchema = z.enum(["ALL", "FOOD", "GENERAL"]);
const moderatorProductsFlaggedSchema = z.enum(["ALL", "YES", "NO"]);

const moderatorProductsSearchParamsSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  q: z.string().trim().max(100).default(""),
  published: moderatorProductsPublishedSchema.default("ALL"),
  foodType: moderatorProductsFoodTypeSchema.default("ALL"),
  flagged: moderatorProductsFlaggedSchema.default("ALL"),
});

function firstValue(value: string | string[] | undefined) {
  if (Array.isArray(value)) {
    return value[0] ?? "";
  }

  return value ?? "";
}

export function parseModeratorProductsSearchParams(
  searchParams: Record<string, string | string[] | undefined> | undefined,
): ModeratorProductsFilters {
  const parsed = moderatorProductsSearchParamsSchema.safeParse({
    page: firstValue(searchParams?.page),
    q: firstValue(searchParams?.q),
    published: firstValue(searchParams?.published),
    foodType: firstValue(searchParams?.foodType),
    flagged: firstValue(searchParams?.flagged),
  });

  if (!parsed.success) {
    return {
      page: 1,
      q: "",
      published: "ALL",
      foodType: "ALL",
      flagged: "ALL",
    };
  }

  return parsed.data;
}
