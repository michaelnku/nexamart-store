import { z } from "zod";
import type { UserReportListFilters } from "@/lib/moderation/getUserReports";
import {
  firstSearchParamValue,
  parseSearchParam,
} from "@/lib/moderation/searchParamHelpers";

const userReportStatusFilterSchema = z.enum([
  "ALL",
  "OPEN",
  "UNDER_REVIEW",
  "RESOLVED",
  "REJECTED",
]);

const userReportReasonFilterSchema = z.enum([
  "ALL",
  "SPAM",
  "SCAM",
  "ABUSIVE_BEHAVIOR",
  "HARASSMENT",
  "FAKE_PRODUCT",
  "PROHIBITED_ITEM",
  "MISLEADING_INFORMATION",
  "OFF_PLATFORM_PAYMENT",
  "INAPPROPRIATE_CONTENT",
  "FRAUD",
  "OTHER",
]);

const userReportTargetTypeFilterSchema = z.enum([
  "ALL",
  "USER",
  "PRODUCT",
  "REVIEW",
  "MESSAGE",
  "STORE",
  "ORDER",
]);

const moderationReportPageSchema = z.coerce.number().int().min(1).default(1);
const moderationReportQuerySchema = z.string().trim().max(100).default("");
const moderationReportStatusParamSchema =
  userReportStatusFilterSchema.default("ALL");
const moderationReportReasonParamSchema =
  userReportReasonFilterSchema.default("ALL");
const moderationReportTargetTypeParamSchema =
  userReportTargetTypeFilterSchema.default("ALL");

export function parseModerationReportSearchParams(
  searchParams: Record<string, string | string[] | undefined> | undefined,
): UserReportListFilters {
  return {
    page: parseSearchParam(
      moderationReportPageSchema,
      firstSearchParamValue(searchParams?.page),
      1,
    ),
    q: parseSearchParam(
      moderationReportQuerySchema,
      firstSearchParamValue(searchParams?.q),
      "",
    ),
    status: parseSearchParam(
      moderationReportStatusParamSchema,
      firstSearchParamValue(searchParams?.status),
      "ALL",
    ),
    reason: parseSearchParam(
      moderationReportReasonParamSchema,
      firstSearchParamValue(searchParams?.reason),
      "ALL",
    ),
    targetType: parseSearchParam(
      moderationReportTargetTypeParamSchema,
      firstSearchParamValue(searchParams?.targetType),
      "ALL",
    ),
  };
}
