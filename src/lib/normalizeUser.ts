import { mapUserProfileAvatar, userProfileAvatarInclude } from "@/lib/media-views";
import { prisma } from "@/lib/prisma";
import { SessionUser, UserDTO } from "@/lib/types";

export async function normalizeUser(
  sessionUser: SessionUser | undefined | null,
): Promise<UserDTO | null> {
  if (!sessionUser?.email) return null;

  const db = await prisma.user.findUnique({
    where: { email: sessionUser.email },
    include: {
      ...userProfileAvatarInclude,
      store: true,
      riderProfile: true,
      staffProfile: true,
    },
  });

  if (!db) return null;

  const normalizedDb = mapUserProfileAvatar(db);

  const isVerified =
    normalizedDb.role === "SELLER"
      ? Boolean(normalizedDb.store?.isVerified)
      : normalizedDb.role === "RIDER"
        ? Boolean(normalizedDb.riderProfile?.isVerified)
        : normalizedDb.role === "ADMIN" || normalizedDb.role === "MODERATOR"
          ? Boolean(normalizedDb.staffProfile?.isVerified)
          : false;

  return {
    id: normalizedDb.id,
    email: normalizedDb.email,
    role: normalizedDb.role,
    emailVerifiedAt: normalizedDb.emailVerified?.toISOString() ?? null,
    isEmailVerified: Boolean(normalizedDb.emailVerified),
    hasPassword: Boolean(normalizedDb.password),
    name: normalizedDb.name ?? "",
    username: normalizedDb.username ?? "",
    image: normalizedDb.image ?? null,
    profileAvatar: normalizedDb.profileAvatar as UserDTO["profileAvatar"],
    isBanned: normalizedDb.isBanned,
    isVerified,
  };
}
