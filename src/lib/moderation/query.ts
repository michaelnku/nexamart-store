import { z } from "zod";
import type { IncidentListFilters } from "@/lib/moderation/getModerationIncidents";
import {
  firstSearchParamValue,
  parseSearchParam,
} from "@/lib/moderation/searchParamHelpers";

const moderationStatusFilterSchema = z.enum([
  "ALL",
  "OPEN",
  "RESOLVED",
  "OVERTURNED",
  "IGNORED",
]);

const reviewStatusFilterSchema = z.enum([
  "ALL",
  "NOT_REQUIRED",
  "PENDING_HUMAN_REVIEW",
  "HUMAN_CONFIRMED",
  "HUMAN_OVERTURNED",
]);

const moderationSeverityFilterSchema = z.enum([
  "ALL",
  "LOW",
  "MEDIUM",
  "HIGH",
  "CRITICAL",
]);

const moderationTargetTypeFilterSchema = z.enum([
  "ALL",
  "PRODUCT",
  "PRODUCT_IMAGE",
  "MESSAGE",
  "CONVERSATION",
  "REVIEW",
  "STORE",
  "USER",
  "DISPUTE",
  "VERIFICATION",
  "ORDER",
]);

const moderationSourceFilterSchema = z.enum(["ALL", "AI", "HUMAN"]);

const moderationIncidentPageSchema = z.coerce.number().int().min(1).default(1);
const moderationIncidentQuerySchema = z.string().trim().max(100).default("");
const moderationIncidentStatusParamSchema =
  moderationStatusFilterSchema.default("ALL");
const moderationIncidentReviewStatusParamSchema =
  reviewStatusFilterSchema.default("ALL");
const moderationIncidentSeverityParamSchema =
  moderationSeverityFilterSchema.default("ALL");
const moderationIncidentTargetTypeParamSchema =
  moderationTargetTypeFilterSchema.default("ALL");
const moderationIncidentSourceParamSchema =
  moderationSourceFilterSchema.default("ALL");

export function parseModerationIncidentSearchParams(
  searchParams: Record<string, string | string[] | undefined> | undefined,
): IncidentListFilters {
  return {
    page: parseSearchParam(
      moderationIncidentPageSchema,
      firstSearchParamValue(searchParams?.page),
      1,
    ),
    q: parseSearchParam(
      moderationIncidentQuerySchema,
      firstSearchParamValue(searchParams?.q),
      "",
    ),
    status: parseSearchParam(
      moderationIncidentStatusParamSchema,
      firstSearchParamValue(searchParams?.status),
      "ALL",
    ),
    reviewStatus: parseSearchParam(
      moderationIncidentReviewStatusParamSchema,
      firstSearchParamValue(searchParams?.reviewStatus),
      "ALL",
    ),
    severity: parseSearchParam(
      moderationIncidentSeverityParamSchema,
      firstSearchParamValue(searchParams?.severity),
      "ALL",
    ),
    targetType: parseSearchParam(
      moderationIncidentTargetTypeParamSchema,
      firstSearchParamValue(searchParams?.targetType),
      "ALL",
    ),
    source: parseSearchParam(
      moderationIncidentSourceParamSchema,
      firstSearchParamValue(searchParams?.source),
      "ALL",
    ),
  };
}
