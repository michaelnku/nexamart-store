import { prisma } from "@/lib/prisma";
import { SessionUser, UserDTO } from "@/lib/types";

export async function normalizeUser(
  sessionUser: SessionUser | undefined | null
): Promise<UserDTO | null> {
  if (!sessionUser?.email) return null;

  const db = await prisma.user.findUnique({
    where: { email: sessionUser.email },
    select: {
      id: true,
      email: true,
      role: true,
      name: true,
      username: true,
      image: true,
      isBanned: true,
    },
  });

  if (!db) return null;

  return {
    id: db.id,
    email: db.email,
    role: db.role,

    name: db.name ?? "",
    username: db.username ?? "",
    image: db.image ?? null,
    isBanned: db.isBanned ?? false,
  };
}
