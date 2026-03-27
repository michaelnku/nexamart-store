import { auth } from "@/auth/auth";
import { mapUserProfileAvatar, userProfileAvatarInclude } from "@/lib/media-views";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) return Response.json(null);

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    include: {
      ...userProfileAvatarInclude,
      store: true,
      riderProfile: true,
      staffProfile: true,
    },
  });

  if (!user) return Response.json(null);

  const normalizedUser = mapUserProfileAvatar(user);

  return Response.json({
    id: normalizedUser.id,
    email: normalizedUser.email,
    role: normalizedUser.role,
    name: normalizedUser.name ?? "",
    username: normalizedUser.username ?? "",
    image: normalizedUser.image ?? null,
    profileAvatar: normalizedUser.profileAvatar ?? null,
    isBanned: normalizedUser.isBanned,
    emailVerifiedAt: normalizedUser.emailVerified?.toISOString() ?? null,
    isEmailVerified: Boolean(normalizedUser.emailVerified),
    hasPassword: Boolean(normalizedUser.password),
    store: normalizedUser.store,
    riderProfile: normalizedUser.riderProfile,
    staffProfile: normalizedUser.staffProfile,
    isVerified:
      normalizedUser.role === "SELLER"
        ? normalizedUser.store?.isVerified
        : normalizedUser.role === "RIDER"
          ? normalizedUser.riderProfile?.isVerified
          : normalizedUser.role === "ADMIN" || normalizedUser.role === "MODERATOR"
            ? normalizedUser.staffProfile?.isVerified
            : false,
  });
}
