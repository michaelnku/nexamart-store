import { z } from "zod";
import type { UserReportListFilters } from "@/lib/moderation/getUserReports";

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

const moderationReportSearchParamsSchema = z.object({
  q: z.string().trim().max(100).default(""),
  status: userReportStatusFilterSchema.default("ALL"),
  reason: userReportReasonFilterSchema.default("ALL"),
  targetType: userReportTargetTypeFilterSchema.default("ALL"),
});

function firstValue(value: string | string[] | undefined) {
  if (Array.isArray(value)) {
    return value[0] ?? "";
  }

  return value ?? "";
}

export function parseModerationReportSearchParams(
  searchParams: Record<string, string | string[] | undefined> | undefined,
): UserReportListFilters {
  const parsed = moderationReportSearchParamsSchema.safeParse({
    q: firstValue(searchParams?.q),
    status: firstValue(searchParams?.status),
    reason: firstValue(searchParams?.reason),
    targetType: firstValue(searchParams?.targetType),
  });

  if (!parsed.success) {
    return {
      q: "",
      status: "ALL",
      reason: "ALL",
      targetType: "ALL",
    };
  }

  return parsed.data;
}
