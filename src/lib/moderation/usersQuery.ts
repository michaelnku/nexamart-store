import { z } from "zod";
import type { ModerationUsersFilters } from "@/lib/moderation/getModerationUsers";
import {
  firstSearchParamValue,
  parseSearchParam,
} from "@/lib/moderation/searchParamHelpers";

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

const moderationUsersPageSchema = z.coerce.number().int().min(1).default(1);
const moderationUsersQuerySchema = z.string().trim().max(100).default("");
const moderationUsersRoleParamSchema =
  moderationUserRoleFilterSchema.default("ALL");
const moderationUsersStateParamSchema =
  moderationUserStateFilterSchema.default("ALL");
const moderationUsersBlockedParamSchema =
  moderationUserBlockedFilterSchema.default("ALL");

export function parseModerationUsersSearchParams(
  searchParams: Record<string, string | string[] | undefined> | undefined,
): ModerationUsersFilters {
  return {
    page: parseSearchParam(
      moderationUsersPageSchema,
      firstSearchParamValue(searchParams?.page),
      1,
    ),
    q: parseSearchParam(
      moderationUsersQuerySchema,
      firstSearchParamValue(searchParams?.q),
      "",
    ),
    role: parseSearchParam(
      moderationUsersRoleParamSchema,
      firstSearchParamValue(searchParams?.role),
      "ALL",
    ),
    state: parseSearchParam(
      moderationUsersStateParamSchema,
      firstSearchParamValue(searchParams?.state),
      "ALL",
    ),
    blocked: parseSearchParam(
      moderationUsersBlockedParamSchema,
      firstSearchParamValue(searchParams?.blocked),
      "ALL",
    ),
  };
}
