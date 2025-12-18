import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  req: Request,
  context: { params: Promise<{ userId: string }> }
) {
  const { userId } = await context.params;

  console.log("🔵 API ROUTE HIT — userId:", userId);

  if (!userId) {
    console.error("❌ userId missing in params");
    return NextResponse.json({ error: "Missing userId" }, { status: 400 });
  }

  try {
    const store = await prisma.store.findFirst({
      where: {
        userId,
        isDeleted: false,
      },
    });

    if (!store) {
      return Response.json({ status: "DELETED" }, { status: 404 });
    }

    console.log("🟢 Prisma store result:", store);

    return NextResponse.json(store);
  } catch (error) {
    console.error("🔥 Prisma error:", error);
    return NextResponse.json(
      { error: "Failed to fetch store" },
      { status: 500 }
    );
  }
}
