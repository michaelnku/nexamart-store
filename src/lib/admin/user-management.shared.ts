import { UserRole } from "@/generated/prisma/client";
import { z } from "zod";
import {
  firstSearchParamValue,
  parseSearchParam,
} from "@/lib/moderation/searchParamHelpers";

export const ADMIN_USERS_PAGE_SIZE = 12;

export const adminUserRoleFilterSchema = z.enum([
  "ALL",
  "SELLER",
  "RIDER",
  "MODERATOR",
]);

export type AdminUserRoleFilter = z.infer<typeof adminUserRoleFilterSchema>;

export const adminUsersSortSchema = z.enum([
  "newest",
  "oldest",
  "name_asc",
  "name_desc",
  "role",
]);

export type AdminUsersSort = z.infer<typeof adminUsersSortSchema>;

export const ADMIN_ASSIGNABLE_USER_ROLES = [
  "USER",
  "SELLER",
  "RIDER",
  "MODERATOR",
] as const satisfies readonly UserRole[];

export type AdminAssignableUserRole =
  (typeof ADMIN_ASSIGNABLE_USER_ROLES)[number];

export const ADMIN_PROTECTED_USER_ROLES = ["ADMIN", "SYSTEM"] as const;

export const USER_ROLE_LABELS: Record<UserRole, string> = {
  USER: "Customer",
  ADMIN: "Admin",
  SELLER: "Seller",
  RIDER: "Rider",
  MODERATOR: "Moderator",
  SYSTEM: "System",
};

export const ADMIN_ROLE_FILTER_LABELS: Record<AdminUserRoleFilter, string> = {
  ALL: "All users",
  SELLER: "Sellers",
  RIDER: "Riders",
  MODERATOR: "Moderators",
};

export const ADMIN_USERS_SORT_LABELS: Record<AdminUsersSort, string> = {
  newest: "Newest first",
  oldest: "Oldest first",
  name_asc: "Name A-Z",
  name_desc: "Name Z-A",
  role: "Role",
};

export type AdminManageableUser = {
  id: string;
  email: string;
  name: string | null;
  username: string | null;
  role: UserRole;
  createdAt: string;
  emailVerified: boolean;
  isBanned: boolean;
  profileAvatar: {
    url: string;
  } | null;
  store:
    | {
        id: string;
        name: string;
        slug: string;
        isActive: boolean;
        isVerified: boolean;
        isSuspended: boolean;
      }
    | null;
  riderProfile:
    | {
        id: string;
        isVerified: boolean;
        isAvailable: boolean;
        vehicleType: string | null;
      }
    | null;
  staffProfile:
    | {
        id: string;
        isVerified: boolean;
        status: string;
        department: string | null;
        joinedAt: string;
      }
    | null;
  isRoleProtected: boolean;
};

export type AdminManageableUsersResult = {
  items: AdminManageableUser[];
  pagination: {
    page: number;
    pageSize: number;
    totalItems: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
  };
  filters: {
    query: string;
    roleFilter: AdminUserRoleFilter;
    sort: AdminUsersSort;
  };
};

export type AdminUsersPageConfig = {
  title: string;
  description?: string;
  emptyStateText: string;
  roleFilter: AdminUserRoleFilter;
};

export type AdminUsersSearchParams = {
  page: number;
  query: string;
  sort: AdminUsersSort;
};

const adminUsersSearchParamsSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  query: z.string().trim().max(100).default(""),
  sort: adminUsersSortSchema.default("newest"),
});

export function parseAdminUsersSearchParams(
  searchParams: Record<string, string | string[] | undefined> | undefined,
): AdminUsersSearchParams {
  return {
    page: parseSearchParam(
      z.coerce.number().int().min(1).default(1),
      firstSearchParamValue(searchParams?.page),
      1,
    ),
    query: parseSearchParam(
      z.string().trim().max(100).default(""),
      firstSearchParamValue(searchParams?.q),
      "",
    ),
    sort: parseSearchParam(
      adminUsersSortSchema.default("newest"),
      firstSearchParamValue(searchParams?.sort),
      "newest",
    ),
  };
}

export function isProtectedAdminRole(role: UserRole) {
  return ADMIN_PROTECTED_USER_ROLES.includes(
    role as (typeof ADMIN_PROTECTED_USER_ROLES)[number],
  );
}
