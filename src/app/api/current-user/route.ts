import { auth } from "@/auth/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) return Response.json(null);

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    include: {
      store: true,
      riderProfile: true,
      staffProfile: true,
    },
  });

  if (!user) return Response.json(null);

  return Response.json({
    id: user.id,
    email: user.email,
    role: user.role,
    name: user.name ?? "",
    username: user.username ?? "",
    image: user.image ?? null,
    profileAvatar: user.profileAvatar ?? null,
    isBanned: user.isBanned,
    emailVerifiedAt: user.emailVerified?.toISOString() ?? null,
    isEmailVerified: Boolean(user.emailVerified),
    store: user.store,
    riderProfile: user.riderProfile,
    staffProfile: user.staffProfile,
    isVerified:
      user.role === "SELLER"
        ? user.store?.isVerified
        : user.role === "RIDER"
          ? user.riderProfile?.isVerified
          : user.role === "ADMIN" || user.role === "MODERATOR"
            ? user.staffProfile?.isVerified
            : false,
  });
}
