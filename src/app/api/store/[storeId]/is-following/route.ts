import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth/auth";

export async function GET(
  req: Request,
  context: { params: Promise<{ storeId: string }> }
) {
  const session = await auth();
  const userId = session?.user?.id;
  const { storeId } = await context.params;

  if (!userId) return NextResponse.json({ following: false });

  const following = await prisma.storeFollower.findFirst({
    where: { storeId, userId },
  });

  return NextResponse.json({ following: !!following });
}
