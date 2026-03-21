import { z } from "zod";
import type { ModerationUsersFilters } from "@/lib/moderation/getModerationUsers";

const moderationUserRoleFilterSchema = z.enum([
  "ALL",
  "USER",
  "SELLER",
  "RIDER",
  "MODERATOR",
  "ADMIN",
  "SYSTEM",
]);

const moderationUserStateFilterSchema = z.enum([
  "ALL",
  "CLEAR",
  "WARNED",
  "RESTRICTED",
  "SOFT_BLOCKED",
]);

const moderationUserBlockedFilterSchema = z.enum(["ALL", "YES", "NO"]);

const moderationUsersSearchParamsSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  q: z.string().trim().max(100).default(""),
  role: moderationUserRoleFilterSchema.default("ALL"),
  state: moderationUserStateFilterSchema.default("ALL"),
  blocked: moderationUserBlockedFilterSchema.default("ALL"),
});

function firstValue(value: string | string[] | undefined) {
  if (Array.isArray(value)) {
    return value[0] ?? "";
  }

  return value ?? "";
}

export function parseModerationUsersSearchParams(
  searchParams: Record<string, string | string[] | undefined> | undefined,
): ModerationUsersFilters {
  const parsed = moderationUsersSearchParamsSchema.safeParse({
    page: firstValue(searchParams?.page),
    q: firstValue(searchParams?.q),
    role: firstValue(searchParams?.role),
    state: firstValue(searchParams?.state),
    blocked: firstValue(searchParams?.blocked),
  });

  if (!parsed.success) {
    return {
      page: 1,
      q: "",
      role: "ALL",
      state: "ALL",
      blocked: "ALL",
    };
  }

  return parsed.data;
}
