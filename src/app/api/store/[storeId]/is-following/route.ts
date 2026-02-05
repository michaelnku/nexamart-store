import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth/auth";

export async function GET(
  req: Request,
  { params }: { params: { storeId: string } }
) {
  const session = await auth();
  const userId = session?.user?.id;
  const { storeId } = params;

  if (!userId) return NextResponse.json({ following: false });

  const following = await prisma.storeFollower.findFirst({
    where: { storeId, userId },
  });

  return NextResponse.json({ following: !!following });
}
