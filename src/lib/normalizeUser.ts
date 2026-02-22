import { prisma } from "@/lib/prisma";
import { SessionUser, UserDTO } from "@/lib/types";

export async function normalizeUser(
  sessionUser: SessionUser | undefined | null,
): Promise<UserDTO | null> {
  if (!sessionUser?.email) return null;

  const db = await prisma.user.findUnique({
    where: { email: sessionUser.email },
    include: {
      store: { select: { isVerified: true } },
      riderProfile: { select: { isVerified: true } },
    },
  });

  if (!db) return null;

  const isVerified =
    db.role === "SELLER"
      ? Boolean(db.store?.isVerified)
      : db.role === "RIDER"
        ? Boolean(db.riderProfile?.isVerified)
        : false;

  return {
    id: db.id,
    email: db.email,
    role: db.role,
    name: db.name ?? "",
    username: db.username ?? "",
    image: db.image ?? null,
    profileAvatar: (db.profileAvatar as UserDTO["profileAvatar"]) ?? null,
    isBanned: db.isBanned,
    isVerified,
  };
}
