import { z } from "zod";
import type { ModeratorProductsFilters } from "@/lib/moderation/getModeratorProducts";
import {
  firstSearchParamValue,
  parseSearchParam,
} from "@/lib/moderation/searchParamHelpers";

const moderatorProductsPublishedSchema = z.enum(["ALL", "YES", "NO"]);
const moderatorProductsFoodTypeSchema = z.enum(["ALL", "FOOD", "GENERAL"]);
const moderatorProductsFlaggedSchema = z.enum(["ALL", "YES", "NO"]);

const moderatorProductsPageSchema = z.coerce.number().int().min(1).default(1);
const moderatorProductsQuerySchema = z.string().trim().max(100).default("");
const moderatorProductsPublishedParamSchema =
  moderatorProductsPublishedSchema.default("ALL");
const moderatorProductsFoodTypeParamSchema =
  moderatorProductsFoodTypeSchema.default("ALL");
const moderatorProductsFlaggedParamSchema =
  moderatorProductsFlaggedSchema.default("ALL");

export function parseModeratorProductsSearchParams(
  searchParams: Record<string, string | string[] | undefined> | undefined,
): ModeratorProductsFilters {
  return {
    page: parseSearchParam(
      moderatorProductsPageSchema,
      firstSearchParamValue(searchParams?.page),
      1,
    ),
    q: parseSearchParam(
      moderatorProductsQuerySchema,
      firstSearchParamValue(searchParams?.q),
      "",
    ),
    published: parseSearchParam(
      moderatorProductsPublishedParamSchema,
      firstSearchParamValue(searchParams?.published),
      "ALL",
    ),
    foodType: parseSearchParam(
      moderatorProductsFoodTypeParamSchema,
      firstSearchParamValue(searchParams?.foodType),
      "ALL",
    ),
    flagged: parseSearchParam(
      moderatorProductsFlaggedParamSchema,
      firstSearchParamValue(searchParams?.flagged),
      "ALL",
    ),
  };
}
