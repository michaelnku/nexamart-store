import "server-only";

import { Prisma, UserRole } from "@/generated/prisma/client";

import {
  ADMIN_USERS_PAGE_SIZE,
  type AdminManageableUser,
  type AdminManageableUsersResult,
  type AdminUserRoleFilter,
  type AdminUsersSort,
  isProtectedAdminRole,
} from "@/lib/admin/user-management.shared";
import { mapUserProfileAvatar, userProfileAvatarInclude } from "@/lib/media-views";
import { prisma } from "@/lib/prisma";

type GetAdminUsersInput = {
  page?: number;
  pageSize?: number;
  query?: string;
  sort?: AdminUsersSort;
  roleFilter?: AdminUserRoleFilter;
};

function buildRoleWhere(roleFilter: AdminUserRoleFilter): Prisma.UserWhereInput {
  if (roleFilter === "ALL") {
    return {
      role: {
        not: "SYSTEM",
      },
    };
  }

  return {
    role: roleFilter as UserRole,
  };
}

function buildOrderBy(sort: AdminUsersSort): Prisma.UserOrderByWithRelationInput[] {
  switch (sort) {
    case "oldest":
      return [{ createdAt: "asc" }];
    case "name_asc":
      return [{ name: "asc" }, { email: "asc" }];
    case "name_desc":
      return [{ name: "desc" }, { email: "desc" }];
    case "role":
      return [{ role: "asc" }, { createdAt: "desc" }];
    case "newest":
    default:
      return [{ createdAt: "desc" }];
  }
}

function mapAdminManageableUser(
  user: Prisma.UserGetPayload<{
    select: {
      id: true;
      email: true;
      name: true;
      username: true;
      role: true;
      createdAt: true;
      emailVerified: true;
      isBanned: true;
      profileAvatarFileAsset: true;
      store: {
        select: {
          id: true;
          name: true;
          slug: true;
          isActive: true;
          isVerified: true;
          isSuspended: true;
        };
      };
      riderProfile: {
        select: {
          id: true;
          isVerified: true;
          isAvailable: true;
          vehicleType: true;
        };
      };
      staffProfile: {
        select: {
          id: true;
          isVerified: true;
          status: true;
          department: true;
          joinedAt: true;
        };
      };
    };
  }>,
): AdminManageableUser {
  const normalizedUser = mapUserProfileAvatar(user);
  const avatar = normalizedUser.profileAvatar?.url
    ? { url: normalizedUser.profileAvatar.url }
    : null;

  return {
    id: user.id,
    email: user.email,
    name: user.name,
    username: user.username,
    role: user.role,
    createdAt: user.createdAt.toISOString(),
    emailVerified: Boolean(user.emailVerified),
    isBanned: user.isBanned,
    profileAvatar: avatar,
    store: user.store,
    riderProfile: user.riderProfile,
    staffProfile: user.staffProfile
      ? {
          ...user.staffProfile,
          joinedAt: user.staffProfile.joinedAt.toISOString(),
        }
      : null,
    isRoleProtected: isProtectedAdminRole(user.role),
  };
}

export async function getAdminUsers({
  page = 1,
  pageSize = ADMIN_USERS_PAGE_SIZE,
  query = "",
  sort = "newest",
  roleFilter = "ALL",
}: GetAdminUsersInput = {}): Promise<AdminManageableUsersResult> {
  const normalizedPage = Math.max(1, page);
  const normalizedPageSize = Math.max(1, Math.min(pageSize, 50));
  const normalizedQuery = query.trim();

  const where: Prisma.UserWhereInput = {
    deletedAt: null,
    isDeleted: false,
    ...buildRoleWhere(roleFilter),
    ...(normalizedQuery
      ? {
          OR: [
            {
              name: {
                contains: normalizedQuery,
                mode: "insensitive",
              },
            },
            {
              email: {
                contains: normalizedQuery,
                mode: "insensitive",
              },
            },
            {
              username: {
                contains: normalizedQuery,
                mode: "insensitive",
              },
            },
            {
              store: {
                is: {
                  name: {
                    contains: normalizedQuery,
                    mode: "insensitive",
                  },
                },
              },
            },
          ],
        }
      : {}),
  };

  const totalItems = await prisma.user.count({ where });
  const totalPages = Math.max(1, Math.ceil(totalItems / normalizedPageSize));
  const effectivePage = Math.min(normalizedPage, totalPages);

  const users = await prisma.user.findMany({
    where,
    orderBy: buildOrderBy(sort),
    skip: (effectivePage - 1) * normalizedPageSize,
    take: normalizedPageSize,
    select: {
      id: true,
      email: true,
      name: true,
      username: true,
      role: true,
      createdAt: true,
      emailVerified: true,
      isBanned: true,
      ...userProfileAvatarInclude,
      store: {
        select: {
          id: true,
          name: true,
          slug: true,
          isActive: true,
          isVerified: true,
          isSuspended: true,
        },
      },
      riderProfile: {
        select: {
          id: true,
          isVerified: true,
          isAvailable: true,
          vehicleType: true,
        },
      },
      staffProfile: {
        select: {
          id: true,
          isVerified: true,
          status: true,
          department: true,
          joinedAt: true,
        },
      },
    },
  });

  return {
    items: users.map(mapAdminManageableUser),
    pagination: {
      page: effectivePage,
      pageSize: normalizedPageSize,
      totalItems,
      totalPages,
      hasNextPage: effectivePage < totalPages,
      hasPreviousPage: effectivePage > 1,
    },
    filters: {
      query: normalizedQuery,
      roleFilter,
      sort,
    },
  };
}

export const getAdminManageableUsers = getAdminUsers;
