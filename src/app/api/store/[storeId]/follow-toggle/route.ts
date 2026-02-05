import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth/auth";

export async function POST(
  req: Request,
  context: { params: Promise<{ storeId: string }> }
) {
  try {
    const { storeId } = await context.params;
    const session = await auth();
    const userId = session?.user?.id;

    if (!storeId) {
      return NextResponse.json({ error: "Missing storeId" }, { status: 400 });
    }

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const existing = await prisma.storeFollower.findFirst({
      where: { storeId, userId },
    });

    if (existing) {
      await prisma.storeFollower.delete({
        where: { id: existing.id },
      });

      return NextResponse.json({ following: false });
    }

    await prisma.storeFollower.create({
      data: { storeId, userId },
    });

    return NextResponse.json({ following: true });
  } catch (error) {
    console.error("FOLLOW ERROR:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
