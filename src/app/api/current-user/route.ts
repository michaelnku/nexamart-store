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
    ...user,
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
