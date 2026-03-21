import { z } from "zod";
import type { AiModerationQueueFilters } from "@/lib/moderation/getAiModerationQueue";

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

const aiModerationSearchParamsSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  q: z.string().trim().max(100).default(""),
  status: moderationStatusFilterSchema.default("ALL"),
  reviewStatus: reviewStatusFilterSchema.default("PENDING_HUMAN_REVIEW"),
  severity: moderationSeverityFilterSchema.default("ALL"),
  targetType: moderationTargetTypeFilterSchema.default("ALL"),
});

function firstValue(value: string | string[] | undefined) {
  if (Array.isArray(value)) {
    return value[0] ?? "";
  }

  return value ?? "";
}

export function parseAiModerationSearchParams(
  searchParams: Record<string, string | string[] | undefined> | undefined,
): AiModerationQueueFilters {
  const parsed = aiModerationSearchParamsSchema.safeParse({
    page: firstValue(searchParams?.page),
    q: firstValue(searchParams?.q),
    status: firstValue(searchParams?.status),
    reviewStatus: firstValue(searchParams?.reviewStatus),
    severity: firstValue(searchParams?.severity),
    targetType: firstValue(searchParams?.targetType),
  });

  if (!parsed.success) {
    return {
      page: 1,
      q: "",
      status: "ALL",
      reviewStatus: "PENDING_HUMAN_REVIEW",
      severity: "ALL",
      targetType: "ALL",
      pendingOnly: true,
    };
  }

  return {
    ...parsed.data,
    pendingOnly: !searchParams?.reviewStatus,
  };
}
