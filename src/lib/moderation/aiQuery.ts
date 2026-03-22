import { z } from "zod";
import type { AiModerationQueueFilters } from "@/lib/moderation/getAiModerationQueue";
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

const aiModerationPageSchema = z.coerce.number().int().min(1).default(1);
const aiModerationQuerySchema = z.string().trim().max(100).default("");
const aiModerationStatusParamSchema = moderationStatusFilterSchema.default("ALL");
const aiModerationReviewStatusParamSchema =
  reviewStatusFilterSchema.default("PENDING_HUMAN_REVIEW");
const aiModerationSeverityParamSchema =
  moderationSeverityFilterSchema.default("ALL");
const aiModerationTargetTypeParamSchema =
  moderationTargetTypeFilterSchema.default("ALL");

export function parseAiModerationSearchParams(
  searchParams: Record<string, string | string[] | undefined> | undefined,
): AiModerationQueueFilters {
  return {
    page: parseSearchParam(
      aiModerationPageSchema,
      firstSearchParamValue(searchParams?.page),
      1,
    ),
    q: parseSearchParam(
      aiModerationQuerySchema,
      firstSearchParamValue(searchParams?.q),
      "",
    ),
    status: parseSearchParam(
      aiModerationStatusParamSchema,
      firstSearchParamValue(searchParams?.status),
      "ALL",
    ),
    reviewStatus: parseSearchParam(
      aiModerationReviewStatusParamSchema,
      firstSearchParamValue(searchParams?.reviewStatus),
      "PENDING_HUMAN_REVIEW",
    ),
    severity: parseSearchParam(
      aiModerationSeverityParamSchema,
      firstSearchParamValue(searchParams?.severity),
      "ALL",
    ),
    targetType: parseSearchParam(
      aiModerationTargetTypeParamSchema,
      firstSearchParamValue(searchParams?.targetType),
      "ALL",
    ),
    pendingOnly: firstSearchParamValue(searchParams?.reviewStatus) === undefined,
  };
}
