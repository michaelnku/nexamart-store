import { z } from "zod";
import type { IncidentListFilters } from "@/lib/moderation/getModerationIncidents";

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

const moderationIncidentSearchParamsSchema = z.object({
  q: z.string().trim().max(100).default(""),
  status: moderationStatusFilterSchema.default("ALL"),
  reviewStatus: reviewStatusFilterSchema.default("ALL"),
  severity: moderationSeverityFilterSchema.default("ALL"),
  targetType: moderationTargetTypeFilterSchema.default("ALL"),
  source: moderationSourceFilterSchema.default("ALL"),
});

function firstValue(value: string | string[] | undefined) {
  if (Array.isArray(value)) {
    return value[0] ?? "";
  }

  return value ?? "";
}

export function parseModerationIncidentSearchParams(
  searchParams: Record<string, string | string[] | undefined> | undefined,
): IncidentListFilters {
  const parsed = moderationIncidentSearchParamsSchema.safeParse({
    q: firstValue(searchParams?.q),
    status: firstValue(searchParams?.status),
    reviewStatus: firstValue(searchParams?.reviewStatus),
    severity: firstValue(searchParams?.severity),
    targetType: firstValue(searchParams?.targetType),
    source: firstValue(searchParams?.source),
  });

  if (!parsed.success) {
    return {
      q: "",
      status: "ALL",
      reviewStatus: "ALL",
      severity: "ALL",
      targetType: "ALL",
      source: "ALL",
    };
  }

  return parsed.data;
}
